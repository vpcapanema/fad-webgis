# FAD WebGIS

Este repositório contém a aplicação **WebGIS** da Plataforma FAD — Ferramenta de Análise Dinamizada. A aplicação é responsável por visualizar, de forma interativa, camadas geoespaciais publicadas via serviços OGC (WMS/WFS).

## 🌐 Acesso público

> **URL:** https://www.fad-webgis.lat/

## 📂 Estrutura do projeto

```
fad-webgis/
├── index.html              # Página principal
├── css/                    # Estilos visuais (mapa, menu, cabeçalho, rodapé)
├── js/                     # Scripts para controle de camadas e mapas
├── imagens/                # Logos, favicons e ícones do sistema
└── public/                 # Recursos estáticos adicionais (opcional)
```

## 🧭 Funcionalidades

- Visualização de camadas geográficas (raster e vetoriais)
- Controle de grupos temáticos e ativação dinâmica
- Integração com QGIS Server e GeoServer
- Consumo de camadas via WMS e WFS (com suporte a legendas e estilos)

## 🚀 Publicação na AWS (S3)

Para publicar este site na web via S3 + CloudFront, execute:

```bash
aws s3 sync . s3://www.fad-webgis.lat --delete
```

> Requer AWS CLI configurado e permissões de escrita no bucket S3.

## 📦 Dependências

- [Leaflet.js](https://leafletjs.com/)
- [AWS S3 + CloudFront](https://aws.amazon.com/s3/)
- [QGIS Server](https://docs.qgis.org/) / [GeoServer](https://geoserver.org/)

## 🧪 Desenvolvedor

- **Dr. Vinicius P Capanema**
- DER/SP — Diretoria de Planejamento / Coordenadoria de Estudos e Pesquisas

## 🗓️ Última atualização

Maio de 2025
