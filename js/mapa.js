// js/mapa.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. INICIALIZAÇÃO DO MAPA
    // =================================================================
    const map = L.map('map', {
        center: [-23.55, -46.63],
        zoom: 7,
        minZoom: 4,
        maxZoom: 19,
        zoomControl: false, // Desativado para usar a barra de ferramentas personalizada
        attributionControl: true
    });
    window.map = map; // Expondo globalmente para outros scripts

    // 2. DEFINIÇÃO DOS MAPAS BASE
    // =================================================================
    const baseMaps = {
        'Google Streets': L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google'
        }),
        'Google Híbrido': L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google'
        }),
        'Google Satélite': L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            attribution: '&copy; Google'
        }),
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }),
        'ESRI Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        }),
        'CartoDB Posição': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        })
    };

    let currentBaseMap = baseMaps['Google Streets'];
    currentBaseMap.addTo(map);

    // 3. CONTROLES E FERRAMENTAS DO MAPA
    // =================================================================
    L.control.scale({ imperial: false }).addTo(map);

    const measureControl = L.control.measure({
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'hectares',
        secondaryAreaUnit: 'sqmeters',
        activeColor: '#007bff',
        completedColor: '#0056b3',
        localization: 'pt_BR'
    });
    measureControl.addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: { polygon: true, polyline: true, rectangle: true, circle: true, marker: true }
    });
    map.addControl(drawControl);

    // Esconde os controles padrão dos plugins
    document.querySelector('.leaflet-draw').style.display = 'none';
    document.querySelector('.leaflet-control-measure').style.display = 'none';

    // 4. LÓGICA DA BARRA DE FERRAMENTAS E MODAIS
    // =================================================================
    const basemapModal = document.getElementById('basemap-modal');
    const legendModal = document.getElementById('legend-modal');
    const shareModal = document.getElementById('share-modal');

    const toggleModal = (modal, forceState) => {
        if (!modal) return;
        const isActive = modal.classList.contains('active');
        if (forceState === 'open' && !isActive) modal.classList.add('active');
        else if (forceState === 'close' && isActive) modal.classList.remove('active');
        else if (!forceState) modal.classList.toggle('active');
    };

    const populateBasemapModal = () => {
        const basemapList = document.getElementById('basemap-list');
        if (!basemapList) return;
        basemapList.innerHTML = '';
        Object.keys(baseMaps).forEach(name => {
            const item = document.createElement('div');
            item.className = 'basemap-item';
            if (map.hasLayer(baseMaps[name])) {
                item.classList.add('active');
            }
            // Adicionar thumbnail (placeholder por enquanto)
            item.innerHTML = `<img src="https://via.placeholder.com/100x80.png?text=${name.replace(' ','+')}" alt="${name}"><span>${name}</span>`;
            item.onclick = () => {
                map.removeLayer(currentBaseMap);
                currentBaseMap = baseMaps[name];
                map.addLayer(currentBaseMap);
                document.querySelectorAll('.basemap-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                setTimeout(() => toggleModal(basemapModal, 'close'), 200);
            };
            basemapList.appendChild(item);
        });
    };

    document.getElementById('btn-basemap').addEventListener('click', () => {
        populateBasemapModal();
        toggleModal(basemapModal, 'open');
    });
    document.getElementById('btn-zoom-in').addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => map.zoomOut());

    // Simula o clique no botão invisível do plugin de medição
    document.getElementById('btn-measure').addEventListener('click', () => {
        document.querySelector('.leaflet-control-measure-toggle').click();
    });

    // Ativa a primeira ferramenta de desenho (polígono) como exemplo
    document.getElementById('btn-draw').addEventListener('click', () => {
        new L.Draw.Polygon(map, drawControl.options.draw.polygon).enable();
    });

    document.getElementById('btn-legend').addEventListener('click', () => toggleModal(legendModal, 'open'));
    document.getElementById('btn-share').addEventListener('click', () => toggleModal(shareModal, 'open'));

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleModal(btn.closest('.modal-container'), 'close');
        });
    });

    // 5. CONSULTA DE INFORMAÇÕES (GetFeatureInfo)
    // =================================================================
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
        return layer._url + L.Util.getParamString(params, layer._url);
    }

    map.on('click', function (e) {
        if (window._activeLayers) {
            const activeLayerKeys = Object.keys(window._activeLayers);
            if (activeLayerKeys.length === 0) return;
            const activeLayerName = activeLayerKeys[activeLayerKeys.length - 1];
            const activeLayer = window._activeLayers[activeLayerName];

            if (!activeLayer || !activeLayer.wmsParams) return;

            const url = getFeatureInfoUrl(e.latlng, activeLayer, map);
            fetch(url)
                .then(r => r.json())
                .then(data => {
                    if (data.features && data.features.length > 0) {
                        const props = data.features[0].properties;
                        let html = '<div class="info-popup"><b>Informações da Camada:</b><br><ul>';
                        for (const k in props) {
                            html += `<li><b>${k}</b>: ${props[k]}</li>`;
                        }
                        html += '</ul></div>';
                        L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
                    }
                }).catch(err => console.error("Erro no GetFeatureInfo:", err));
        }
    });
});
