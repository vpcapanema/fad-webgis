# Script para sincronizar webgis entre S3 e pasta local
# Bucket e caminho já configurados

$bucket = "fad-webgis-simple-6896"
$s3Path = "webgis"
$localPath = "C:\Users\vinic\fad-webgis"

Write-Host "Sincronizando do S3 para local (sem deletar arquivos locais extras)..." -ForegroundColor Cyan
aws s3 sync "s3://$bucket/$s3Path" "$localPath"

Write-Host "Sincronizando do local para S3 (mantendo o S3 igual ao local)..." -ForegroundColor Cyan
aws s3 sync "$localPath" "s3://$bucket/$s3Path" --delete

Write-Host "Sincronização concluída!" -ForegroundColor Green
