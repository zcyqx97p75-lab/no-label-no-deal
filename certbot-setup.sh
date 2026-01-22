#!/bin/bash
# Let's Encrypt SSL-Zertifikat für nolabelnodeal.eu einrichten
# Dieses Skript muss auf dem Server 88.198.219.246 als root/sudo ausgeführt werden

# Prüfe ob Certbot installiert ist
if ! command -v certbot &> /dev/null; then
    echo "Certbot ist nicht installiert. Installiere Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-apache
fi

# Installiere SSL-Zertifikat für nolabelnodeal.eu
# Certbot erstellt automatisch Apache VirtualHost mit SSL
echo "Installiere SSL-Zertifikat für nolabelnodeal.eu..."
sudo certbot --apache -d nolabelnodeal.eu --redirect --non-interactive --agree-tos --email admin@nolabelnodeal.eu

# Prüfe ob Zertifikat erfolgreich installiert wurde
if [ $? -eq 0 ]; then
    echo "SSL-Zertifikat erfolgreich installiert!"
    echo "Prüfe Zertifikat mit: sudo certbot certificates"
else
    echo "Fehler beim Installieren des SSL-Zertifikats!"
    exit 1
fi

# Apache neu laden um Änderungen anzuwenden
echo "Lade Apache neu..."
sudo systemctl reload apache2

echo "Fertig! SSL-Zertifikat für nolabelnodeal.eu ist eingerichtet."
