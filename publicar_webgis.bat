@echo off
echo Publicando WebGIS no S3...

aws s3 sync "C:\Users\vinic\webgis_estadualizacao" s3://www.fad-webgis.lat ^
--region us-east-2 ^
--delete ^
--cache-control "no-cache"

echo Publicado com sucesso!
pause
