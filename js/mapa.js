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
    map.addControl(drawControl);    // Inicialmente esconde os controles padrão dos plugins
    const drawControlElement = document.querySelector('.leaflet-draw');
    const measureControlElement = document.querySelector('.leaflet-control-measure');
    
    if (drawControlElement) drawControlElement.style.display = 'none';
    if (measureControlElement) measureControlElement.style.display = 'none';

    // Função para mostrar/esconder controles dos plugins
    const togglePluginControls = (showDraw = false, showMeasure = false) => {
        if (drawControlElement) {
            drawControlElement.style.display = showDraw ? 'block' : 'none';
        }
        if (measureControlElement) {
            measureControlElement.style.display = showMeasure ? 'block' : 'none';
        }
    };// 4. LÓGICA DA BARRA DE FERRAMENTAS, PAINÉIS E ESTADO DAS FERRAMENTAS
    // =================================================================
    const basemapPanel = document.getElementById('basemap-panel');
    const legendModal = document.getElementById('legend-modal');
    const shareModal = document.getElementById('share-modal');
    const measurementResults = document.getElementById('measurement-results');

    let activeTool = null; // Controla a ferramenta ativa ('measure', 'draw', 'basemap')
    let currentDrawHandler = null;
    let measurementCount = 0;

    const togglePanel = (panel, forceState) => {
        if (!panel) return;
        const isActive = panel.classList.contains('active');
        if (forceState === 'open' && !isActive) panel.classList.add('active');
        else if (forceState === 'close' && isActive) panel.classList.remove('active');
        else if (!forceState) panel.classList.toggle('active');
    };

    const toggleModal = (modal, forceState) => {
        if (!modal) return;
        const isActive = modal.classList.contains('active');
        if (forceState === 'open' && !isActive) modal.classList.add('active');
        else if (forceState === 'close' && isActive) modal.classList.remove('active');
        else if (!forceState) modal.classList.toggle('active');
    };

    const addMeasurementResult = (type, value) => {
        measurementCount++;
        const measurementList = document.getElementById('measurement-list');
        if (!measurementList) return;

        const item = document.createElement('div');
        item.className = 'measurement-item';
        item.innerHTML = `
            <div class="measurement-type">${type} #${measurementCount}</div>
            <div class="measurement-value">${value}</div>
        `;
        measurementList.appendChild(item);
        
        // Mostra o painel de resultados
        togglePanel(measurementResults, 'open');
        
        // Scroll para o final da lista
        measurementList.scrollTop = measurementList.scrollHeight;
    };

    const clearMeasurements = () => {
        const measurementList = document.getElementById('measurement-list');
        if (measurementList) {
            measurementList.innerHTML = '';
        }
        togglePanel(measurementResults, 'close');
        measurementCount = 0;
    };    const deactivateAllTools = () => {
        // Desativa a ferramenta de desenho se estiver ativa
        if (currentDrawHandler) {
            currentDrawHandler.disable();
            currentDrawHandler = null;
        }
        // Desativa a ferramenta de medição se estiver ativa
        const measureToggle = document.querySelector('.leaflet-control-measure-toggle');
        if (measureToggle && measureToggle.parentElement.classList.contains('leaflet-control-measure-on')) {
            measureToggle.click(); // Simula o clique para desativar
        }
        // Esconde todos os controles dos plugins
        togglePluginControls(false, false);
        // Fecha o painel de mapas base
        togglePanel(basemapPanel, 'close');
        // Remove a classe 'active' de todos os botões de ferramenta
        document.querySelectorAll('.tool-btn.active').forEach(btn => btn.classList.remove('active'));
        activeTool = null;
    };

    const populateBasemapPanel = () => {
        const basemapList = document.getElementById('basemap-list');
        if (!basemapList) return;
        basemapList.innerHTML = '';
        Object.keys(baseMaps).forEach(name => {
            const item = document.createElement('div');
            item.className = 'basemap-item';
            if (map.hasLayer(baseMaps[name])) {
                item.classList.add('active');
            }
            // Criar miniaturas simples com CSS ao invés de imagens externas
            const thumbnail = document.createElement('div');
            thumbnail.className = 'basemap-thumbnail';
            thumbnail.style.cssText = `
                width: 60px; height: 45px; border-radius: 4px; margin-right: 12px;
                background: linear-gradient(45deg, #4a90e2, #7bb3f0);
                display: flex; align-items: center; justify-content: center;
                color: white; font-size: 10px; text-align: center;
            `;
            thumbnail.textContent = name.substring(0, 3);
            
            const span = document.createElement('span');
            span.textContent = name;
            span.style.fontSize = '14px';
            
            item.appendChild(thumbnail);
            item.appendChild(span);
            
            item.onclick = () => {
                map.removeLayer(currentBaseMap);
                currentBaseMap = baseMaps[name];
                map.addLayer(currentBaseMap);
                document.querySelectorAll('.basemap-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                setTimeout(() => togglePanel(basemapPanel, 'close'), 300);
            };
            basemapList.appendChild(item);
        });
    };    // --- Event Listeners para os Botões da Barra de Ferramentas ---

    document.getElementById('btn-basemap').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const isDeactivating = button.classList.contains('active');
        deactivateAllTools();
        if (!isDeactivating) {
            populateBasemapPanel();
            togglePanel(basemapPanel, 'open');
            button.classList.add('active');
            activeTool = 'basemap';
        }
    });

    document.getElementById('btn-zoom-in').addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => map.zoomOut());    document.getElementById('btn-measure').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const isDeactivating = button.classList.contains('active');
        deactivateAllTools();
        if (!isDeactivating) {
            togglePluginControls(false, true); // Mostra controle de medição
            document.querySelector('.leaflet-control-measure-toggle').click();
            button.classList.add('active');
            activeTool = 'measure';
        }
    });

    document.getElementById('btn-draw').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const isDeactivating = button.classList.contains('active');
        deactivateAllTools();
        if (!isDeactivating) {
            togglePluginControls(true, false); // Mostra controle de desenho
            currentDrawHandler = new L.Draw.Polygon(map, drawControl.options.draw.polygon);
            currentDrawHandler.enable();
            button.classList.add('active');
            activeTool = 'draw';
        }
    });

    document.getElementById('btn-legend').addEventListener('click', () => {
        deactivateAllTools();
        toggleModal(legendModal, 'open');
    });
    
    document.getElementById('btn-download').addEventListener('click', () => {
        deactivateAllTools();
        // Implementar funcionalidade de download
        alert('Funcionalidade de download será implementada em breve.');
    });
    
    document.getElementById('btn-share').addEventListener('click', () => {
        deactivateAllTools();
        toggleModal(shareModal, 'open');
    });    // Event listeners para fechar painéis e modais
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            toggleModal(btn.closest('.modal-container'), 'close');
        });
    });

    document.getElementById('basemap-panel-close-btn')?.addEventListener('click', () => {
        togglePanel(basemapPanel, 'close');
        document.getElementById('btn-basemap').classList.remove('active');
        activeTool = null;
    });

    document.getElementById('clear-measurements')?.addEventListener('click', clearMeasurements);

    // 5. EVENTOS DE MEDIÇÃO PARA CAPTURAR RESULTADOS
    // =================================================================
    map.on('measurefinish', (e) => {
        if (e.measureType === 'distance') {
            addMeasurementResult('Distância', e.totalDistance);
        } else if (e.measureType === 'area') {
            addMeasurementResult('Área', e.totalArea);
        }
        
        // Desativa a ferramenta após a medição
        if (activeTool === 'measure') {
            deactivateAllTools();
        }
    });

    // 6. CONSULTA DE INFORMAÇÕES (GetFeatureInfo)
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
        // Não executa GetFeatureInfo se uma ferramenta estiver ativa
        if (activeTool) return;

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

    // 7. EVENTOS DO MAPA PARA GERENCIAR ESTADO DAS FERRAMENTAS
    // =================================================================
    map.on(L.Draw.Event.CREATED, (event) => {
        drawnItems.addLayer(event.layer);
        deactivateAllTools(); // Sai do modo de desenho após criar a forma
    });

    map.on('draw:drawstop', () => {
        // Garante que o estado da UI seja redefinido se o desenho for cancelado
        if (activeTool === 'draw') {
            deactivateAllTools();
        }
    });    map.on('measurefinish', () => {
        // Este evento já é tratado na seção de eventos de medição acima
        // Mantido aqui apenas para compatibilidade
    });

    document.getElementById('copy-share-url')?.addEventListener('click', () => {
        const shareUrl = document.getElementById('share-url');
        if (shareUrl) {
            shareUrl.select();
            shareUrl.setSelectionRange(0, 99999); // Para dispositivos móveis
            navigator.clipboard.writeText(shareUrl.value).then(() => {
                alert('Link copiado para a área de transferência!');
            }).catch(() => {
                alert('Erro ao copiar link. Tente selecionar e copiar manualmente.');
            });
        }
    });
});
