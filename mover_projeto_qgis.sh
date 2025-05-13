#!/bin/bash
# ✅ Executar dentro da EC2 após o envio via SCP

# Caminhos
ORIGEM="/tmp/camadas_fad_webgis_ok_FINAL.qgs"
DESTINO="/var/www/qgis_projects/camadas_fad_webgis_ok_FINAL.qgs"

echo "Movendo o projeto QGIS para /var/www/qgis_projects..."
sudo mv "$ORIGEM" "$DESTINO"
sudo chown www-data:www-data "$DESTINO"
sudo chmod 644 "$DESTINO"
echo "✅ Projeto movido com sucesso!"
