// js/menu_camadas.js
import { layerConfig, GEOSERVER_URL } from './layers.js';


document.addEventListener('DOMContentLoaded', () => {
  const map = window.map;
  const sidebarContent = document.getElementById('sidebar-content');

  const wfsStyle = {
    color: "#ff0000",
    weight: 2,
    fillColor: "#ffaa00",
    fillOpacity: 0.4
  };

  const buildMenu = (config, container) => {
    for (const [title, cfg] of Object.entries(config)) {
      if (cfg.layer) {
        const item = `
          <div class="camada-item">
            <div class="camada-item-header">
              <input type="checkbox" id="${title}">
              <label for="${title}" class="camada-nome">${title}</label>
            </div>
          </div>
        `;
        const temp = document.createElement('div');
        temp.innerHTML = item;
        const layerItem = temp.firstElementChild;
        const checkbox = layerItem.querySelector('input');

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            if (cfg.type === 'wfs') {
              const wfsUrl = `${GEOSERVER_URL}&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=${cfg.layer}&OUTPUTFORMAT=application/json`;
              fetch(wfsUrl)
                .then(r => r.json())
                .then(data => {
                  window._activeLayers[title] = L.geoJSON(data, {
                    style: wfsStyle
                  }).addTo(map);
                });
            } else {
              window._activeLayers[title] = L.tileLayer.wms(GEOSERVER_URL, {
                layers: cfg.layer,
                transparent: true,
                format: 'image/png',
                version: '1.3.0'
              }).addTo(map);
            }
          } else {
            if (window._activeLayers[title]) {
              map.removeLayer(window._activeLayers[title]);
              delete window._activeLayers[title];
            }
          }
        });

        container.appendChild(layerItem);

        if (title === "Limite Estadual") {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change'));
        }

      } else {
        const grupoHTML = `
          <div class="grupo-camadas">
            <div class="grupo-header">
              <span class="toggle-button">+</span>
              <span class="grupo-nome">${title}</span>
              <input type="checkbox" class="grupo-checkbox">
            </div>
            <div class="grupo-body" style="display: none;"></div>
          </div>
        `;
        const grupo = document.createElement('div');
        grupo.innerHTML = grupoHTML;
        const grupoBody = grupo.querySelector('.grupo-body');
        const toggleButton = grupo.querySelector('.toggle-button');

        buildMenu(cfg, grupoBody);

        toggleButton.addEventListener('click', () => {
          const isHidden = grupoBody.style.display === 'none';
          grupoBody.style.display = isHidden ? 'block' : 'none';
          toggleButton.textContent = isHidden ? '–' : '+';
        });

        grupo.querySelector('.grupo-checkbox').addEventListener('change', (e) => {
          const checked = e.target.checked;
          const checkboxes = grupoBody.querySelectorAll('input[type="checkbox"]');
          checkboxes.forEach(cb => {
            if (cb.checked !== checked) {
              cb.checked = checked;
              cb.dispatchEvent(new Event('change'));
            }
          });
        });

        container.appendChild(grupo);
      }
    }
  };

  buildMenu(layerConfig, sidebarContent);
});
