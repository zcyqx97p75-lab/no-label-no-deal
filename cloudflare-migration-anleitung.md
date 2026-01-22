# Anleitung: DNS von Hetzner zu Cloudflare migrieren

## Warum Cloudflare?

- **CNAME Flattening**: Ermöglicht CNAME für Root-Domain (`@`)
- **Kostenlos**: DNS-Management ist kostenlos
- **Automatische SSL**: Railway stellt automatisch SSL-Zertifikate aus
- **Kein Server-Zugriff nötig**: Alles über DNS-Konfiguration lösbar

## Schritt 1: Cloudflare Account erstellen

1. Gehe zu [cloudflare.com](https://www.cloudflare.com)
2. Klicke auf "Sign Up" (kostenlos)
3. Bestätige E-Mail-Adresse

## Schritt 2: Domain zu Cloudflare hinzufügen

1. Im Cloudflare Dashboard: Klicke auf "Add a Site"
2. Gib `nolabelnodeal.eu` ein
3. Wähle kostenlosen Plan (Free)
4. Cloudflare scannt automatisch bestehende DNS-Records

## Schritt 3: DNS-Records in Cloudflare konfigurieren

### Wichtige Records die übertragen werden müssen:

**Root-Domain:**
- **Typ**: `CNAME` (nicht A-Record!)
- **Name**: `@`
- **Target**: `web-production-5e475.up.railway.app`
- **Proxy**: ✅ Aktiviert (Orange Cloud)

**WWW-Subdomain:**
- **Typ**: `CNAME`
- **Name**: `www`
- **Target**: `web-production-5e475.up.railway.app`
- **Proxy**: ✅ Aktiviert (Orange Cloud)

**Mail-Records (beibehalten):**
- **MX-Record**:
  - Name: `@`
  - Priority: `10`
  - Target: `www4.your-server.de`
- **CNAME**:
  - Name: `autoconfig`
  - Target: `mail.your-server.de`

### Checkliste DNS-Records:

```
✅ @ → CNAME → web-production-5e475.up.railway.app (Proxied)
✅ www → CNAME → web-production-5e475.up.railway.app (Proxied)
✅ @ → MX → www4.your-server.de (Priority 10)
✅ autoconfig → CNAME → mail.your-server.de
```

## Schritt 4: Nameserver ändern

**WICHTIG**: Erst wenn alle DNS-Records in Cloudflare korrekt sind!

1. Cloudflare zeigt dir zwei Nameserver (z.B.):
   - `brad.ns.cloudflare.com`
   - `tara.ns.cloudflare.com`

2. In **Hetzner Console**:
   - Gehe zu DNS-Zonen für `nolabelnodeal.eu`
   - Klicke auf "Nameserver" Tab
   - Ändere Nameserver auf Cloudflare-Nameserver
   - Speichere Änderungen

3. **DNS-Propagierung**: Kann 24-48 Stunden dauern

## Schritt 5: Railway Custom Domain hinzufügen

1. In **Railway Dashboard**: 
   - Öffne den Service `web-production-5e475`
   - Gehe zu "Settings" → "Domains"
   - Klicke auf "Custom Domain"

2. Füge beide Domains hinzu:
   - `nolabelnodeal.eu` (Root-Domain)
   - `www.nolabelnodeal.eu` (falls noch nicht vorhanden)

3. Railway stellt automatisch SSL-Zertifikate aus (Let's Encrypt)

## Schritt 6: Prüfen nach Migration

Nach 24-48 Stunden (DNS-Propagierung):

```bash
# DNS-Records prüfen
dig nolabelnodeal.eu @8.8.8.8

# SSL-Zertifikat prüfen
openssl s_client -connect nolabelnodeal.eu:443 -servername nolabelnodeal.eu

# Redirect testen
curl -I https://nolabelnodeal.eu
# Erwartet: Location: https://www.nolabelnodeal.eu
```

## Wichtige Hinweise

⚠️ **Vor der Nameserver-Änderung:**
- Stelle sicher, dass alle DNS-Records in Cloudflare korrekt sind
- Prüfe besonders Mail-Records (MX), damit E-Mail weiterhin funktioniert

⚠️ **Während der Migration:**
- Es kann zu kurzen Downtime kommen
- E-Mail-Funktionalität sollte weiterhin funktionieren (MX-Record bleibt)

⚠️ **Nach der Migration:**
- Railway muss `nolabelnodeal.eu` als Custom Domain erkennen
- SSL-Zertifikat wird automatisch ausgestellt (kann 5-10 Minuten dauern)

## Troubleshooting

### DNS-Propagierung dauert lange
- Normale DNS-Propagierung: 24-48 Stunden
- Cloudflare DNS propagiert normalerweise schneller

### SSL-Zertifikat wird nicht ausgestellt
- Prüfe ob Domain in Railway als Custom Domain hinzugefügt ist
- Prüfe ob DNS-Records korrekt sind: `dig nolabelnodeal.eu`
- Warte 5-10 Minuten nach Domain-Hinzufügung in Railway

### Redirect funktioniert nicht
- Railway Service `web-production-5e475` leitet bereits auf `www.no-label-no-deal.eu` um
- Prüfe ob Service läuft: `curl -I https://web-production-5e475.up.railway.app`
