# Anleitung: Redirect für nolabelnodeal.eu einrichten

## Voraussetzungen

- SSH-Zugriff auf Server `88.198.219.246`
- Root- oder Sudo-Rechte auf dem Server
- Apache ist installiert und läuft
- Port 80 und 443 sind offen (bereits geprüft)

## Schritt 1: Apache VirtualHost erstellen

1. Verbinde dich per SSH mit dem Server:
```bash
ssh user@88.198.219.246
```

2. Erstelle die Apache-Konfigurationsdatei:
```bash
sudo nano /etc/apache2/sites-available/nolabelnodeal.eu.conf
```

3. Kopiere den Inhalt aus `nginx-redirect-config.conf` (korrigiere den Dateinamen - es ist Apache, nicht nginx)

4. Aktiviere das Site:
```bash
sudo a2ensite nolabelnodeal.eu.conf
```

5. Lade Apache neu:
```bash
sudo systemctl reload apache2
```

## Schritt 2: SSL-Zertifikat installieren

**Option A: Mit Certbot (Automatisch - empfohlen)**

1. Installiere Certbot (falls nicht vorhanden):
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-apache
```

2. Installiere SSL-Zertifikat:
```bash
sudo certbot --apache -d nolabelnodeal.eu --redirect --non-interactive --agree-tos --email YOUR_EMAIL@example.com
```

Oder führe das Skript aus:
```bash
chmod +x certbot-setup.sh
sudo ./certbot-setup.sh
```

**Option B: Manuelle Apache-Konfiguration**

Falls Certbot nicht verwendet werden kann, konfiguriere SSL manuell nach der Installation des Zertifikats.

## Schritt 3: Redirect testen

Nach der Konfiguration sollte folgendes funktionieren:

1. HTTP Redirect:
```bash
curl -I http://nolabelnodeal.eu
# Erwartet: Location: https://www.nolabelnodeal.eu
```

2. HTTPS Redirect:
```bash
curl -I https://nolabelnodeal.eu
# Erwartet: Location: https://www.nolabelnodeal.eu
```

3. SSL-Zertifikat prüfen:
```bash
openssl s_client -connect nolabelnodeal.eu:443 -servername nolabelnodeal.eu
# Erwartet: Zertifikat für nolabelnodeal.eu
```

## Fehlerbehebung

### Apache VirtualHost wird nicht geladen
- Prüfe Syntax: `sudo apache2ctl configtest`
- Prüfe ob Site aktiviert: `ls -la /etc/apache2/sites-enabled/ | grep nolabelnodeal`

### SSL-Zertifikat wird nicht erkannt
- Prüfe ob Zertifikat existiert: `sudo certbot certificates`
- Prüfe Apache-Logs: `sudo tail -f /var/log/apache2/error.log`

### Redirect funktioniert nicht
- Prüfe ob Rewrite-Engine aktiviert ist: `sudo a2enmod rewrite`
- Prüfe Apache-Konfiguration: `sudo apache2ctl -S`
