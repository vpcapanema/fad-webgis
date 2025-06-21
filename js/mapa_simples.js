// js/mapa_simples.js - Versão simplificada para aplicação estática

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando WebGIS estático...');
    
    // 1. INICIALIZAÇÃO DO MAPA
    const map = L.map('map', {
        center: [-23.55, -46.63],
        zoom: 7,
        minZoom: 4,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: true
    });
    window.map = map;

    // 2. MAPAS BASE
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
        'ESRI Satélite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri'
        }),
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        })
    };
    
    // Mapa base padrão
    let currentBaseMap = baseMaps['ESRI Satélite'];
    currentBaseMap.addTo(map);

    // 3. CONTROLES BÁSICOS
    L.control.scale({ imperial: false }).addTo(map);
    
    // Controle de medição
    const measureControl = L.control.measure({
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'hectares',
        secondaryAreaUnit: 'sqmeters',
        activeColor: '#007bff',
        completedColor: '#0056b3'
    });
    measureControl.addTo(map);
    
    // Controle de desenho
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: { polygon: true, polyline: true, rectangle: true, circle: true, marker: true }
    });
    map.addControl(drawControl);    // 4. ESCONDER CONTROLES INICIALMENTE E APLICAR CLASSES CSS
    setTimeout(() => {
        const drawEl = document.querySelector('.leaflet-draw');
        const measureEl = document.querySelector('.leaflet-control-measure');
        
        // Remove a classe active se existir e garante que estejam ocultos
        if (drawEl) {
            drawEl.classList.remove('active');
            drawEl.style.display = 'none'; // Garantia extra
        }
        if (measureEl) {
            measureEl.classList.remove('active');
            measureEl.style.display = 'none'; // Garantia extra
        }
        
        console.log('✅ Controles de plugins ocultados na inicialização');
    }, 500);

    // 5. VARIÁVEIS DE ESTADO SIMPLES
    let activeTool = null;
    let measurementCount = 0;

    // 6. FUNÇÕES AUXILIARES SIMPLES    function hideAllPanels() {
        // Esconder painéis
        const panels = ['#basemap-panel', '#measurement-results', '#legend-modal', '#share-modal'];
        panels.forEach(id => {
            const el = document.querySelector(id);
            if (el) {
                el.classList.remove('active');
                el.style.display = 'none';
            }
        });
        
        // Desativar botões
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Esconder controles usando classes CSS
        const drawEl = document.querySelector('.leaflet-draw');
        const measureEl = document.querySelector('.leaflet-control-measure');
        if (drawEl) {
            drawEl.classList.remove('active');
            drawEl.style.display = 'none'; // Garantia extra
        }
        if (measureEl) {
            measureEl.classList.remove('active');
            measureEl.style.display = 'none'; // Garantia extra
        }
        
        activeTool = null;
    }

    function showPanel(panelId) {
        const panel = document.querySelector(panelId);
        if (panel) {
            panel.classList.add('active');
            panel.style.display = 'block';
        }
    }

    function addMeasurementResult(type, value) {
        measurementCount++;
        const list = document.getElementById('measurement-list');
        if (!list) return;

        const item = document.createElement('div');
        item.className = 'measurement-item';
        item.innerHTML = `
            <div style="font-weight: bold; color: #007bff;">${type} #${measurementCount}</div>
            <div style="font-size: 14px; margin-top: 4px;">${value}</div>
        `;
        list.appendChild(item);
        
        showPanel('#measurement-results');
    }

    // 7. EVENT LISTENERS DOS BOTÕES
    
    // Botão Mapas Base
    document.getElementById('btn-basemap')?.addEventListener('click', (e) => {
        if (activeTool === 'basemap') {
            hideAllPanels();
        } else {
            hideAllPanels();
            e.currentTarget.classList.add('active');
            activeTool = 'basemap';
            
            // Popular lista de mapas base
            const list = document.getElementById('basemap-list');
            if (list) {
                list.innerHTML = '';
                Object.keys(baseMaps).forEach(name => {
                    const item = document.createElement('div');
                    item.className = 'basemap-item';
                    item.style.cssText = 'padding: 10px; cursor: pointer; border-bottom: 1px solid #eee;';
                    item.textContent = name;
                    
                    if (map.hasLayer(baseMaps[name])) {
                        item.style.background = '#e3f2fd';
                        item.style.fontWeight = 'bold';
                    }
                    
                    item.onclick = () => {
                        map.removeLayer(currentBaseMap);
                        currentBaseMap = baseMaps[name];
                        map.addLayer(currentBaseMap);
                        hideAllPanels();
                    };
                    
                    list.appendChild(item);
                });
            }
            
            showPanel('#basemap-panel');
        }
    });    // Botão Medição
    document.getElementById('btn-measure')?.addEventListener('click', (e) => {
        if (activeTool === 'measure') {
            hideAllPanels();
        } else {
            hideAllPanels();
            e.currentTarget.classList.add('active');
            activeTool = 'measure';
            
            // Mostrar controle de medição usando classe CSS
            const measureEl = document.querySelector('.leaflet-control-measure');
            if (measureEl) {
                measureEl.classList.add('active');
                measureEl.style.display = 'block'; // Garantia extra
            }
            
            // Ativar ferramenta
            setTimeout(() => {
                const toggle = document.querySelector('.leaflet-control-measure-toggle');
                if (toggle) toggle.click();
            }, 100);
        }
    });    // Botão Desenho
    document.getElementById('btn-draw')?.addEventListener('click', (e) => {
        if (activeTool === 'draw') {
            hideAllPanels();
        } else {
            hideAllPanels();
            e.currentTarget.classList.add('active');
            activeTool = 'draw';
            
            // Mostrar controle de desenho usando classe CSS
            const drawEl = document.querySelector('.leaflet-draw');
            if (drawEl) {
                drawEl.classList.add('active');
                drawEl.style.display = 'block'; // Garantia extra
            }
        }
    });

    // Botão Legenda
    document.getElementById('btn-legend')?.addEventListener('click', () => {
        hideAllPanels();
        
        const content = document.getElementById('legend-content');
        if (content) {
            if (!window._activeLayers || Object.keys(window._activeLayers).length === 0) {
                content.innerHTML = '<p>Nenhuma camada ativa. Ative uma camada para ver sua legenda.</p>';
            } else {
                const activeLayerKeys = Object.keys(window._activeLayers);
                const layerName = activeLayerKeys[activeLayerKeys.length - 1];
                content.innerHTML = `<h4>Legenda: ${layerName}</h4><p>Legenda em desenvolvimento.</p>`;
            }
        }
        
        showPanel('#legend-modal');
    });

    // Botão Compartilhar
    document.getElementById('btn-share')?.addEventListener('click', () => {
        hideAllPanels();
        const urlField = document.getElementById('share-url');
        if (urlField) {
            urlField.value = window.location.href;
        }
        showPanel('#share-modal');
    });

    // Botão Download
    document.getElementById('btn-download')?.addEventListener('click', () => {
        hideAllPanels();
        alert('Funcionalidade de download em desenvolvimento.');
    });

    // Zoom
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => map.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => map.zoomOut());

    // 8. FECHAR PAINÉIS
    document.querySelectorAll('.modal-close-btn, .panel-close-btn').forEach(btn => {
        btn.addEventListener('click', hideAllPanels);
    });

    document.getElementById('clear-measurements')?.addEventListener('click', () => {
        const list = document.getElementById('measurement-list');
        if (list) list.innerHTML = '';
        measurementCount = 0;
        hideAllPanels();
    });

    // 9. CAPTURAR RESULTADOS DE MEDIÇÃO (SIMPLES)
    map.on('measurefinish', () => {
        setTimeout(() => {
            // Procurar por elementos de resultado visíveis
            const results = document.querySelectorAll('.leaflet-measure-result-show');
            results.forEach(el => {
                const text = el.textContent || el.innerText;
                if (text && text.trim()) {
                    if (text.includes('m') && !text.includes('²')) {
                        addMeasurementResult('Distância', text.trim());
                    } else if (text.includes('²') || text.includes('ha')) {
                        addMeasurementResult('Área', text.trim());
                    }
                }
            });
        }, 500);
    });

    // 10. EVENTOS DO MAPA
    map.on(L.Draw.Event.CREATED, (event) => {
        drawnItems.addLayer(event.layer);
        hideAllPanels();
    });

    map.on('draw:drawstop', hideAllPanels);

    // 11. TESTE SIMPLES (apenas localhost)
    if (window.location.hostname === 'localhost') {
        setTimeout(() => {
            const testBtn = document.createElement('button');
            testBtn.textContent = 'Teste';
            testBtn.style.cssText = 'position: fixed; top: 10px; left: 320px; z-index: 999; padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;';
            testBtn.onclick = () => {
                addMeasurementResult('Teste', '100 m');
                console.log('Teste executado');
            };
            document.body.appendChild(testBtn);
        }, 1000);
    }

    // 12. GARANTIR INICIALIZAÇÃO LIMPA
    setTimeout(hideAllPanels, 100);
    
    // FUNÇÃO PARA GARANTIR OCULTAÇÃO TOTAL DOS CONTROLES
    function forceHideAllPluginControls() {
        const selectors = [
            '.leaflet-draw',
            '.leaflet-control-measure',
            '.leaflet-draw-toolbar',
            '.leaflet-control-measure-toggle',
            '.leaflet-control-measure-interaction'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!el.classList.contains('active')) {
                    el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: absolute !important; left: -9999px !important; top: -9999px !important;';
                    el.classList.remove('active');
                }
            });
        });
        
        console.log('🔒 Controles de plugins forçadamente ocultos');
    }

    // Executar ocultação periodicamente para garantir que nada apareça
    forceHideAllPluginControls();
    setInterval(forceHideAllPluginControls, 1000);
    
    console.log('✅ WebGIS estático inicializado com sucesso!');
});
