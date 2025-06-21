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
    };    let currentBaseMap = baseMaps['ESRI Satélite'];
    currentBaseMap.addTo(map);

    // 3. CONTROLES E FERRAMENTAS DO MAPA
    // =================================================================
    L.control.scale({ imperial: false }).addTo(map);    const measureControl = L.control.measure({
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'hectares',
        secondaryAreaUnit: 'sqmeters',
        activeColor: '#007bff',
        completedColor: '#0056b3',
        localization: 'pt_BR',
        // Callback para capturar resultados de medição
        onMeasureFinish: function(result) {
            console.log('Medição finalizada:', result);
            
            let type = '';
            let value = '';
            
            if (result.distance !== undefined) {
                type = 'Distância';
                value = result.distance < 1000 ? 
                    `${result.distance.toFixed(2)} m` : 
                    `${(result.distance / 1000).toFixed(2)} km`;
            } else if (result.area !== undefined) {
                type = 'Área';
                if (result.area < 10000) {
                    value = `${result.area.toFixed(2)} m²`;
                } else {
                    value = `${(result.area / 10000).toFixed(2)} ha`;
                }
            }
            
            if (type && value) {
                addMeasurementResult(type, value);
            }
        }
    });
    measureControl.addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: { polygon: true, polyline: true, rectangle: true, circle: true, marker: true }
    });    map.addControl(drawControl);

    // Inicialmente esconde os controles dos plugins até serem ativados
    setTimeout(() => {
        const drawControl = document.querySelector('.leaflet-draw');
        const measureControl = document.querySelector('.leaflet-control-measure');
          if (drawControl) {
            drawControl.style.display = 'none';
            drawControl.style.zIndex = '1200';
        }
        if (measureControl) {
            measureControl.style.display = 'none';
            measureControl.style.zIndex = '1200';
        }
    }, 500);

    // Função para mostrar/esconder controles dos plugins
    const togglePluginControls = (showDraw = false, showMeasure = false) => {
        const drawControl = document.querySelector('.leaflet-draw');
        const measureControl = document.querySelector('.leaflet-control-measure');
          if (drawControl) {
            drawControl.style.display = showDraw ? 'block' : 'none';
            drawControl.style.visibility = showDraw ? 'visible' : 'hidden';
            drawControl.style.zIndex = '1200';
        }
        if (measureControl) {
            measureControl.style.display = showMeasure ? 'block' : 'none';
            measureControl.style.visibility = showMeasure ? 'visible' : 'hidden';
            measureControl.style.zIndex = '1200';
        }
    };// 4. LÓGICA DA BARRA DE FERRAMENTAS, PAINÉIS E ESTADO DAS FERRAMENTAS
    // =================================================================
    const basemapPanel = document.getElementById('basemap-panel');
    const legendModal = document.getElementById('legend-modal');
    const shareModal = document.getElementById('share-modal');
    const measurementResults = document.getElementById('measurement-results');

    let activeTool = null; // Controla a ferramenta ativa ('measure', 'draw', 'basemap')
    let currentDrawHandler = null;
    let measurementCount = 0;    const togglePanel = (panel, forceState) => {
        if (!panel) return;
        const isActive = panel.classList.contains('active');
        
        if (forceState === 'open' && !isActive) {
            panel.classList.add('active');
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            panel.style.opacity = '1';
        } else if (forceState === 'close' && isActive) {
            panel.classList.remove('active');
            panel.style.display = 'none';
            panel.style.visibility = 'hidden';
            panel.style.opacity = '0';
        } else if (!forceState) {
            if (isActive) {
                panel.classList.remove('active');
                panel.style.display = 'none';
                panel.style.visibility = 'hidden';
                panel.style.opacity = '0';
            } else {
                panel.classList.add('active');
                panel.style.display = 'block';
                panel.style.visibility = 'visible';
                panel.style.opacity = '1';
            }
        }
    };    const toggleModal = (modal, forceState) => {
        if (!modal) return;
        const isActive = modal.classList.contains('active');
        
        if (forceState === 'open' && !isActive) {
            modal.classList.add('active');
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
        } else if (forceState === 'close' && isActive) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
        } else if (!forceState) {
            if (isActive) {
                modal.classList.remove('active');
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                modal.style.opacity = '0';
            } else {
                modal.classList.add('active');
                modal.style.display = 'block';
                modal.style.visibility = 'visible';
                modal.style.opacity = '1';
            }
        }
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
            // Mostra o controle de medição
            togglePluginControls(false, true);
            
            // Ativa a ferramenta de medição
            setTimeout(() => {
                const measureToggle = document.querySelector('.leaflet-control-measure-toggle');
                if (measureToggle) {
                    measureToggle.click();
                }
            }, 100);
            
            button.classList.add('active');
            activeTool = 'measure';
        }
    });

    document.getElementById('btn-draw').addEventListener('click', (e) => {
        const button = e.currentTarget;
        const isDeactivating = button.classList.contains('active');
        deactivateAllTools();
        if (!isDeactivating) {
            // Mostra o controle de desenho
            togglePluginControls(true, false);
            
            // Ativa a ferramenta de desenho
            setTimeout(() => {
                currentDrawHandler = new L.Draw.Polygon(map, drawControl.options.draw.polygon);
                currentDrawHandler.enable();
            }, 100);
            
            button.classList.add('active');
            activeTool = 'draw';
        }
    });    document.getElementById('btn-legend').addEventListener('click', () => {
        deactivateAllTools();
        updateLegendContent();
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

    document.getElementById('clear-measurements')?.addEventListener('click', clearMeasurements);    // 5. EVENTOS DE MEDIÇÃO PARA CAPTURAR RESULTADOS
    // =================================================================
    
    // Função aprimorada para extrair valores de medição da UI
    const extractMeasurementFromUI = () => {
        // Procura por elementos de resultado de medição visíveis
        const measureResults = document.querySelectorAll('.leaflet-measure-result-show, .leaflet-control-measure .measure-result');
        
        measureResults.forEach(element => {
            const text = element.textContent || element.innerText;
            if (text && text.trim()) {
                console.log('Texto de medição encontrado:', text);
                
                // Identifica tipo de medição e extrai valor
                if (text.match(/\d+(\.\d+)?\s*(m|km|metro|quilômetro)/i) && !text.includes('²')) {
                    // É uma medição de distância
                    addMeasurementResult('Distância', text.trim());
                } else if (text.match(/\d+(\.\d+)?\s*(m²|ha|hectare)/i)) {
                    // É uma medição de área
                    addMeasurementResult('Área', text.trim());
                }
            }
        });
    };
    
    // Event listeners para diferentes eventos de medição
    map.on('measurefinish', (e) => {
        console.log('Event measurefinish:', e);
        setTimeout(extractMeasurementFromUI, 500); // Delay para aguardar UI ser atualizada
    });
    
    map.on('measure', (e) => {
        console.log('Event measure:', e);
        setTimeout(extractMeasurementFromUI, 500);
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
    
    const updateLegendContent = () => {
        const legendContent = document.getElementById('legend-content');
        if (!legendContent) return;
        
        // Verifica se há camadas ativas
        if (!window._activeLayers || Object.keys(window._activeLayers).length === 0) {
            legendContent.innerHTML = `
                <div class="no-legend">
                    <p><strong>Nenhuma camada ativa</strong></p>
                    <p>Ative uma camada no menu lateral esquerdo para visualizar sua legenda.</p>
                </div>
            `;
            return;
        }
        
        // Pega a última camada ativada (camada mais recente)
        const activeLayerKeys = Object.keys(window._activeLayers);
        const activeLayerName = activeLayerKeys[activeLayerKeys.length - 1];
        const activeLayer = window._activeLayers[activeLayerName];
        
        if (!activeLayer || !activeLayer.wmsParams) {
            legendContent.innerHTML = `
                <div class="no-legend">
                    <p><strong>Legenda não disponível</strong></p>
                    <p>A camada "${activeLayerName}" não possui legenda disponível.</p>
                </div>
            `;
            return;
        }
        
        // Constrói a URL da legenda usando GetLegendGraphic
        const legendUrl = activeLayer._url + '?' + new URLSearchParams({
            'service': 'WMS',
            'version': '1.1.0',
            'request': 'GetLegendGraphic',
            'layer': activeLayer.wmsParams.layers,
            'format': 'image/png',
            'width': '20',
            'height': '20',
            'legend_options': 'fontAntiAliasing:true;fontSize:12;forceLabels:on'
        });
        
        legendContent.innerHTML = `
            <div class="legend-active">
                <h4>Legenda: ${activeLayerName}</h4>
                <div class="legend-image-container">
                    <img src="${legendUrl}" 
                         alt="Legenda da camada ${activeLayerName}" 
                         style="max-width: 100%; height: auto;"
                         onerror="this.parentElement.innerHTML='<p>Erro ao carregar legenda para esta camada.</p>'">
                </div>
            </div>
        `;
    };
      // Observer aprimorado para capturar resultados de medição
    const observeMeasurementResults = () => {
        let lastCapturedResult = ''; // Evita duplicatas
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    // Procura por elementos de resultado de medição após mudanças no DOM
                    setTimeout(() => {
                        const measureResults = document.querySelectorAll(
                            '.leaflet-measure-result-show, ' +
                            '.leaflet-control-measure .measure-result, ' +
                            '.leaflet-control-measure-on .leaflet-control-measure-result'
                        );
                        
                        measureResults.forEach(element => {
                            if (element.style.display !== 'none' && element.offsetParent !== null) {
                                const text = element.textContent || element.innerText;
                                if (text && text.trim() && text !== lastCapturedResult) {
                                    lastCapturedResult = text;
                                    console.log('Resultado capturado pelo observer:', text);
                                    
                                    // Limpa e processa o texto
                                    const cleanText = text.replace(/[^\d.,\s\w²]/g, '').trim();
                                    
                                    if (cleanText.match(/\d+[.,]?\d*\s*(m|metro|quilômetro|km)/i) && !cleanText.includes('²')) {
                                        addMeasurementResult('Distância', cleanText);
                                    } else if (cleanText.match(/\d+[.,]?\d*\s*(m²|ha|hectare)/i)) {
                                        addMeasurementResult('Área', cleanText);
                                    }
                                }
                            }
                        });
                    }, 200);
                }
            });
        });
        
        // Observa mudanças no mapa e controles de medição
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        // Observer específico para controles de medição
        setTimeout(() => {
            const measureControl = document.querySelector('.leaflet-control-measure');
            if (measureControl) {
                observer.observe(measureControl, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                    attributes: true
                });
            }
        }, 1000);
    };
    
    // Inicia o observer após um delay para garantir que o DOM esteja pronto
    setTimeout(observeMeasurementResults, 1000);

    // Função de teste para verificar captura de medição (pode ser removida após testes)
    window.testMeasurement = () => {
        addMeasurementResult('Distância', '150.25 m');
        addMeasurementResult('Área', '2.5 ha');
        console.log('Teste de medição executado');
    };
      // Debug: adiciona botão de teste temporário (respeitando a barra lateral)
    if (window.location.hostname === 'localhost') {
        setTimeout(() => {
            const testBtn = document.createElement('button');
            testBtn.textContent = 'Teste Medição';
            testBtn.style.cssText = 'position: fixed; top: 10px; left: 320px; z-index: 1100; padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;';
            testBtn.onclick = window.testMeasurement;
            document.body.appendChild(testBtn);
        }, 2000);
    }
    
    // Sistema de debug e logging
    const debug = {
        log: (message, data = null) => {
            if (window.location.hostname === 'localhost') {
                console.log(`[WebGIS Debug] ${message}`, data || '');
            }
        },
        error: (message, error = null) => {
            console.error(`[WebGIS Error] ${message}`, error || '');
        }
    };
    
    // Log inicial
    debug.log('WebGIS iniciado com sucesso');
    debug.log('Mapa base ativo:', currentBaseMap);
    debug.log('Controles adicionados:', {
        measure: measureControl,
        draw: drawControl,
        scale: 'ativo'
    });
    
    // Verificação final do layout e z-index
    const verifyLayout = () => {
        const sidebar = document.getElementById('sidebar');
        const toolbar = document.querySelector('.map-toolbar');
        const measurePanel = document.getElementById('measurement-results');
        
        if (sidebar) {
            const sidebarRect = sidebar.getBoundingClientRect();
            debug.log('Sidebar dimensions:', {
                width: sidebarRect.width,
                left: sidebarRect.left,
                right: sidebarRect.right
            });
            
            // Verifica se elementos estão sobrepostos
            if (toolbar) {
                const toolbarRect = toolbar.getBoundingClientRect();
                if (toolbarRect.left < sidebarRect.right) {
                    debug.error('Toolbar sobrepondo sidebar!', {
                        toolbarLeft: toolbarRect.left,
                        sidebarRight: sidebarRect.right
                    });
                }
            }
        }
    };
    
    // Executa verificação após o DOM estar completamente carregado
    setTimeout(verifyLayout, 3000);

    // Garante que todos os painéis comecem ocultos na inicialização
    const ensureHiddenPanels = () => {
        const elementsToHide = [
            '#basemap-panel',
            '#measurement-results', 
            '#legend-modal',
            '#share-modal',
            '#filter-modal'
        ];
        
        elementsToHide.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.remove('active');
                if (element.style) {
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                    element.style.opacity = '0';
                }
                debug.log(`Elemento ${selector} forçado a ficar oculto`);
            }
        });
        
        // Remove classe active de todos os botões
        document.querySelectorAll('.tool-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        debug.log('Todos os painéis e modais foram forçados a ficarem ocultos');
    };
    
    // Executa imediatamente e depois novamente após delay
    setTimeout(ensureHiddenPanels, 100);
    setTimeout(ensureHiddenPanels, 1000);
});
