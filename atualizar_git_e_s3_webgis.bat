@echo off
echo ==================================================
echo 🚀 Atualizando repositório FAD WebGIS e publicando no S3
echo ==================================================

REM Etapa 1: Git - commit e push
set /p commitmsg=Digite a mensagem do commit: 

echo.
echo 🟡 Realizando commit e push para o GitHub...
git add .
git commit -m "%commitmsg%"
git push

echo.
echo 🟢 Publicando alterações no bucket S3...
aws s3 sync . s3://fad-webgis-simple-6896 --delete

echo.
echo ✅ Tudo pronto! WebGIS atualizado no GitHub e publicado em:
echo 🌐 https://www.fad-webgis.lat/
pause
