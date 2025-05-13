@echo off
SET "PEM_PATH=C:\Users\vinic\.ssh\nova-chave-fad.pem"
SET "ARQUIVO_LOCAL=D:\WEBGIS\PROJETOS\camadas_fad_webgis_ok_FINAL.qgs"
SET "DESTINO=ubuntu@3.143.88.29:/tmp/"

echo Enviando projeto QGIS para o diretório temporário da instância...
scp -i "%PEM_PATH%" "%ARQUIVO_LOCAL%" %DESTINO%
echo Upload concluído. Execute agora os comandos SSH para mover o arquivo.
pause
