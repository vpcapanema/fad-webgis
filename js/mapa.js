// js/mapa.js

// Inicializa o mapa com CRS EPSG:3857 (padrão Web Mercator)
window.map = L.map('map', {
  center: [-23.55, -46.63], // São Paulo
  zoom: 7,
  minZoom: 4,
  maxZoom: 19,
  zoomControl: true,
  attributionControl: true
});

// === Basemaps ===
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(window.map);

const esriStreets = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; Esri &mdash; Source: Esri, NAVTEQ, DeLorme, and others'
});

const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
});

// === Adiciona controle de camadas base ===
const baseMaps = {
  "OpenStreetMap": osm,
  "ESRI - Rua": esriStreets,
  "ESRI - Satélite": esriSatellite
};

L.control.layers(baseMaps, null, { position: 'topleft', collapsed: false }).addTo(window.map);

// === Medida de escala ===
L.control.scale({ imperial: false }).addTo(window.map);

// Função utilitária para construir a URL GetFeatureInfo para camadas WMS Leaflet
function getFeatureInfoUrl(latlng, layer, map) {
  const point = map.latLngToContainerPoint(latlng, map.getZoom());
  const size = map.getSize();
  const params = {
    request: 'GetFeatureInfo',
    service: 'WMS',
    srs: 'EPSG:4326',
    styles: '',
    transparent: true,
    version: '1.3.0',
    format: 'image/png',
    bbox: map.getBounds().toBBoxString(),
    height: size.y,
    width: size.x,
    layers: layer.wmsParams.layers,
    query_layers: layer.wmsParams.layers,
    info_format: 'application/json',
    i: Math.round(point.x),
    j: Math.round(point.y)
  };
  const url = layer._url +
    Object.keys(params)
      .map(k => `${k}=${encodeURIComponent(params[k])}`)
      .join('&');
  return url;
}

// === Consulta dinâmica (popup ao clicar no mapa) ===
window.map.on('click', function(e) {
  // Procura a camada WMS ativa mais acima
  const activeLayerName = Object.keys(window._activeLayers).slice(-1)[0];
  const activeLayer = window._activeLayers[activeLayerName];
  if (!activeLayer || !activeLayer.wmsParams) return;
  const url = getFeatureInfoUrl(e.latlng, activeLayer, window.map);
  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        let html = '<b>Informações:</b><br><ul>';
        for (const k in props) {
          html += `<li><b>${k}</b>: ${props[k]}</li>`;
        }
        html += '</ul>';
        L.popup().setLatLng(e.latlng).setContent(html).openOn(window.map);
      }
    });
});

// === Medição de distância e área ===
// Removido import de CSS via JS. O CSS já está no <head> do HTML.
// Para usar plugins como leaflet-measure e leaflet-draw, adicione os scripts e CSS no HTML:
// <link rel="stylesheet" href="https://unpkg.com/leaflet-measure/dist/leaflet-measure.css" />
// <link rel="stylesheet" href="https://unpkg.com/leaflet-draw/dist/leaflet.draw.css" />
// <script src="https://unpkg.com/leaflet-measure/dist/leaflet-measure.min.js"></script>
// <script src="https://unpkg.com/leaflet-draw/dist/leaflet.draw.js"></script>

if (window.L && window.L.control && window.L.control.measure) {
  L.control.measure({
    primaryLengthUnit: 'meters',
    secondaryLengthUnit: 'kilometers',
    primaryAreaUnit: 'sqmeters',
    secondaryAreaUnit: 'hectares',
    position: 'topleft'
  }).addTo(window.map);
}

// === Consulta espacial (seleção por polígono) ===
if (window.L && window.L.Control && window.L.Control.Draw) {
  const drawnItems = new L.FeatureGroup();
  window.map.addLayer(drawnItems);
  const drawControl = new L.Control.Draw({
    edit: { featureGroup: drawnItems },
    draw: { polygon: true, polyline: false, rectangle: true, circle: false, marker: false, circlemarker: false }
  });
  window.map.addControl(drawControl);
  window.map.on(L.Draw.Event.CREATED, function (e) {
    drawnItems.addLayer(e.layer);
    // Aqui você pode implementar consulta espacial WFS/WMS usando a geometria desenhada
  });
}

// Adiciona eventos aos botões de ferramentas do mapa
import { showLegend, downloadLayerData, shareMapLink } from './menu_camadas.js';

document.getElementById('btn-legend').onclick = () => {
  // Exemplo de legenda simples, pode ser melhorado para gerar dinamicamente
  showLegend('<b>Legenda</b><br>Ative uma camada para ver a legenda.');
};
document.getElementById('btn-download').onclick = () => {
  const layerName = Object.keys(window._activeLayers).slice(-1)[0];
  if (layerName) downloadLayerData(layerName);
};
document.getElementById('btn-share').onclick = () => {
  shareMapLink();
};
// Filtros e consulta espacial podem ser integrados aqui também.
