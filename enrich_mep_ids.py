#!/usr/bin/env python3
"""Enrich MEP CSV with official European Parliament IDs and photo URLs."""
from __future__ import annotations

import csv
import json
import re
import time
import unicodedata
import urllib.request
from pathlib import Path

BASE = "https://data.europarl.europa.eu/api/v2/meps"
PHOTO = "https://www.europarl.europa.eu/mepphoto/{}.jpg"
CSV_PATH = Path(__file__).resolve().parent / "EU_Parlamentarier_aktuell_mit_Mail.csv"
DOCS_PATH = Path(__file__).resolve().parent / "docs" / "mep-photo-matching.md"


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/ld+json",
            "User-Agent": "no-label-no-deal-enricher/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())


def strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    return "".join(c for c in normalized if not unicodedata.combining(c))


def email_locals_from_parts(given: str, family: str) -> set[str]:
    g = strip_accents(given).lower().strip()
    f = strip_accents(family).lower().strip()
    g_clean = re.sub(r"[^a-z0-9]+", "", g)
    f_clean = re.sub(r"[^a-z0-9]+", "", f)
    locals_: set[str] = set()
    if g_clean and f_clean:
        locals_.add(f"{g_clean}.{f_clean}")
        locals_.add(f"{g_clean}{f_clean}")
        first = re.sub(r"[^a-z0-9]+", "", g.split()[0] if g.split() else g_clean)
        if first:
            locals_.add(f"{first}.{f_clean}")
    return locals_


def load_all_meps() -> list[dict]:
    meps: list[dict] = []
    offset = 0
    limit = 100
    while True:
        url = f"{BASE}?format=application%2Fld%2Bjson&offset={offset}&limit={limit}"
        batch = fetch_json(url).get("data") or []
        if not batch:
            break
        meps.extend(batch)
        offset += limit
        if len(batch) < limit:
            break
    return meps


def fetch_email_for_id(ident: str) -> str:
    data = fetch_json(f"{BASE}/{ident}?format=application%2Fld%2Bjson")
    person = (data.get("data") or [{}])[0]
    email = person.get("hasEmail") or ""
    if isinstance(email, list):
        email = email[0] if email else ""
    return str(email).replace("mailto:", "").strip().lower()


def main() -> None:
    print("Downloading MEP list…")
    all_meps = load_all_meps()
    print(f"API MEPs: {len(all_meps)}")

    by_email_guess: dict[str, list[str]] = {}
    by_family: dict[str, list[str]] = {}
    for mep in all_meps:
        ident = str(mep.get("identifier") or "").strip()
        if not ident:
            continue
        given = mep.get("givenName") or ""
        family = mep.get("familyName") or ""
        for local in email_locals_from_parts(given, family):
            by_email_guess.setdefault(local, []).append(ident)
        fam_key = strip_accents(family).lower().strip()
        if fam_key:
            by_family.setdefault(fam_key, []).append(ident)

    with CSV_PATH.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)

    results: dict[str, tuple[str, str]] = {}
    for row in rows:
        email = (row.get("Mailadresse") or "").strip().lower()
        local = email.split("@")[0] if "@" in email else ""
        candidates: list[str] = []
        candidates.extend(by_email_guess.get(local, []))
        candidates.extend(by_email_guess.get(local.replace("-", ""), []))
        seen: set[str] = set()
        uniq = [c for c in candidates if not (c in seen or seen.add(c))]
        if len(uniq) == 1:
            results[email] = ("matched", uniq[0])
        elif not uniq:
            results[email] = ("unmatched", "")
        else:
            matched = ""
            for ident in uniq[:8]:
                if fetch_email_for_id(ident) == email:
                    matched = ident
                    break
                time.sleep(0.03)
            results[email] = ("matched", matched) if matched else ("unmatched", "")

    still = [
        row
        for row in rows
        if results.get((row.get("Mailadresse") or "").strip().lower(), ("unmatched", ""))[0]
        == "unmatched"
    ]
    for row in still:
        email = (row.get("Mailadresse") or "").strip().lower()
        family = strip_accents(row.get("Name") or "").lower().strip()
        for ident in by_family.get(family, [])[:20]:
            if fetch_email_for_id(ident) == email:
                results[email] = ("matched", ident)
                break
            time.sleep(0.03)

    for key in ("ep_id", "photo_url", "match_status"):
        if key not in fieldnames:
            fieldnames.append(key)

    out_rows = []
    unmatched_rows = []
    for row in rows:
        email = (row.get("Mailadresse") or "").strip().lower()
        status, epid = results.get(email, ("unmatched", ""))
        nrow = dict(row)
        if status == "matched" and epid:
            nrow["ep_id"] = epid
            nrow["photo_url"] = PHOTO.format(epid)
            nrow["match_status"] = "matched"
        else:
            nrow["ep_id"] = ""
            nrow["photo_url"] = ""
            nrow["match_status"] = "unmatched"
            unmatched_rows.append(nrow)
        out_rows.append(nrow)

    with CSV_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter=";")
        writer.writeheader()
        writer.writerows(out_rows)

    matched_n = sum(1 for row in out_rows if row["match_status"] == "matched")
    DOCS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DOCS_PATH.open("w", encoding="utf-8") as handle:
        handle.write("# MEP Photo / EP-ID Matching\n\n")
        handle.write(f"- Total MEPs in CSV: {len(out_rows)}\n")
        handle.write(f"- Matched with official EP ID: {matched_n}\n")
        handle.write(f"- Unmatched (placeholder): {len(unmatched_rows)}\n")
        handle.write(
            "- Photo URL pattern: `https://www.europarl.europa.eu/mepphoto/{id}.jpg`\n"
        )
        handle.write("- API source: `https://data.europarl.europa.eu/api/v2/meps`\n\n")
        handle.write("## Unmatched MEPs\n\n")
        handle.write("| Vorname | Name | Land | E-Mail |\n|---|---|---|---|\n")
        for row in unmatched_rows:
            handle.write(
                f"| {row.get('Vorname', '')} | {row.get('Name', '')} | "
                f"{row.get('Land', '')} | {row.get('Mailadresse', '')} |\n"
            )

    print(f"Matched {matched_n}/{len(out_rows)}; unmatched {len(unmatched_rows)}")
    print(f"Wrote {CSV_PATH} and {DOCS_PATH}")


if __name__ == "__main__":
    main()
