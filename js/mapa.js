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
