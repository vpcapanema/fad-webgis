document.addEventListener('DOMContentLoaded', function() {
  const crsContainer = document.getElementById('crs-container');
  const escalaContainer = document.getElementById('escala-container');
  const datumSelect = document.getElementById('datum');
  const tipoCoordSelect = document.getElementById('tipo-coord');
  const dataHoraSpan = document.getElementById('dataHora');

  const datumMap = {
    '4674': 'geografico',
    '31982': 'utm',
    '31983': 'utm',
    '5880': 'projetado',
    '4326': 'geografico',
    '32722': 'utm',
    '32723': 'utm'
  };

  function atualizarCRS(lat, lng) {
    const tipoDatum = datumMap[datumSelect.value];
    const tipoCoord = tipoCoordSelect.value;

    if (tipoDatum === 'geografico') {
      if (tipoCoord === 'decimal') {
        crsContainer.innerHTML = `
          <small>Lat:</small> <input type="text" readonly value="${lat.toFixed(6)}°" class="crs-input" />
          <small>Long:</small> <input type="text" readonly value="${lng.toFixed(6)}°" class="crs-input" />
        `;
      } else if (tipoCoord === 'dms') {
        crsContainer.innerHTML = `
          <small>Lat:</small> <input type="text" readonly value="${toDMS(lat, 'lat')}" class="crs-input" />
          <small>Long:</small> <input type="text" readonly value="${toDMS(lng, 'lng')}" class="crs-input" />
        `;
      }
      tipoCoordSelect.disabled = false;
    } else if (tipoDatum === 'projetado') {
      crsContainer.innerHTML = `
        <small>X:</small> <input type="text" readonly value="${lng.toFixed(2)} m" class="crs-input" />
        <small>Y:</small> <input type="text" readonly value="${lat.toFixed(2)} m" class="crs-input" />
      `;
      tipoCoordSelect.disabled = true;
    } else if (tipoDatum === 'utm') {
      const utm = toUTM(lat, lng);
      crsContainer.innerHTML = `
        <small>Zona:</small> <input type="text" readonly value="${utm.zone}S" class="crs-input" />
        <small>E:</small> <input type="text" readonly value="${utm.easting}" class="crs-input" />
        <small>N:</small> <input type="text" readonly value="${utm.northing}" class="crs-input" />
      `;
      tipoCoordSelect.disabled = true;
    }
  }

  function toDMS(deg, tipo) {
    const absolute = Math.abs(deg);
    const graus = Math.floor(absolute);
    const minutosNotDecimal = (absolute - graus) * 60;
    const minutos = Math.floor(minutosNotDecimal);
    const segundos = ((minutosNotDecimal - minutos) * 60).toFixed(2);
    const direcao = tipo === 'lat' ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    return `${graus}° ${minutos}' ${segundos}" ${direcao}`;
  }

  function toUTM(lat, lon) {
    const zone = Math.floor((lon + 180) / 6) + 1;
    const a = 6378137.0;
    const e = 0.0818191908;
    const k0 = 0.9996;
    const lonOrigin = (zone - 1) * 6 - 180 + 3;
    const latRad = lat * Math.PI / 180.0;
    const lonRad = lon * Math.PI / 180.0;
    const lonOriginRad = lonOrigin * Math.PI / 180.0;

    const N = a / Math.sqrt(1 - Math.pow(e * Math.sin(latRad), 2));
    const T = Math.pow(Math.tan(latRad), 2);
    const C = Math.pow(e * Math.cos(latRad), 2) / (1 - Math.pow(e, 2));
    const A = Math.cos(latRad) * (lonRad - lonOriginRad);

    const M = a * (
      (1 - Math.pow(e, 2)/4 - 3*Math.pow(e,4)/64 - 5*Math.pow(e,6)/256) * latRad
      - (3*Math.pow(e,2)/8 + 3*Math.pow(e,4)/32 + 45*Math.pow(e,6)/1024) * Math.sin(2*latRad)
      + (15*Math.pow(e,4)/256 + 45*Math.pow(e,6)/1024) * Math.sin(4*latRad)
      - (35*Math.pow(e,6)/3072) * Math.sin(6*latRad)
    );

    const easting = (k0*N*(A+(1-T+C)*Math.pow(A,3)/6+(5-18*T+T*T+72*C-58*(Math.pow(e,2)))*Math.pow(A,5)/120)+500000.0).toFixed(2);
    const northing = (k0*(M+N*Math.tan(latRad)*(Math.pow(A,2)/2+(5-T+9*C+4*C*C)*Math.pow(A,4)/24+(61-58*T+T*T+600*C-330*(Math.pow(e,2)))*Math.pow(A,6)/720))).toFixed(2);

    return { zone, easting, northing };
  }

  function atualizarEscala() {
    const zoom = map.getZoom();
    const resolutions = [
      156543.0339, 78271.51695, 39135.758475, 19567.8792375, 9783.93961875,
      4891.969809375, 2445.9849046875, 1222.9924523438, 611.49622617188,
      305.74811308594, 152.87405654297, 76.437028271484, 38.218514135742,
      19.109257067871, 9.5546285339355, 4.7773142669678, 2.3886571334839,
      1.1943285667419, 0.59716428337097
    ];
    const dpi = 96;
    const inchesPerMeter = 39.3701;
    const resolution = resolutions[zoom] || resolutions[resolutions.length - 1];
    const escala = Math.round(resolution * dpi * inchesPerMeter);

    escalaContainer.innerText = `Escala: 1:${escala.toLocaleString('pt-BR')}`;
  }

  function atualizarDataHora() {
    const now = new Date();
    const formatado = now.toLocaleString('pt-BR', { hour12: false });
    dataHoraSpan.innerText = `Atualizado em: ${formatado}`;
  }

  // Eventos
  map.on('mousemove', function(e) {
    atualizarCRS(e.latlng.lat, e.latlng.lng);
  });

  map.on('move', atualizarEscala);
  map.on('zoomend', atualizarEscala);

  datumSelect.addEventListener('change', function() {
    atualizarCRS(map.getCenter().lat, map.getCenter().lng);
  });

  tipoCoordSelect.addEventListener('change', function() {
    atualizarCRS(map.getCenter().lat, map.getCenter().lng);
  });

  setInterval(atualizarDataHora, 1000);

  // Inicializações
  atualizarEscala();
  atualizarDataHora();
});
