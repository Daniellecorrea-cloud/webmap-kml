// ===============================
// 1) Mapa base
// ===============================

const map = L.map("map", { preferCanvas: true }).setView([-19.92, -43.94], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// ===============================
// 2) Elementos da interface
// ===============================

const overlayLayers = {};
const legendEl = document.getElementById("legend");
const layersEl = document.getElementById("layers");

if (!legendEl) console.error("Elemento #legend não encontrado");
if (!layersEl) console.error("Elemento #layers não encontrado");

// ===============================
// 3) Funções auxiliares UI
// ===============================

function addLegendItem(name, color) {
  const li = document.createElement("li");
  li.innerHTML = `
    <span class="swatch" style="background:${color}"></span>
    <span>${name}</span>
  `;
  legendEl.appendChild(li);
}

function addLayerToggle(name) {
  const id = "chk_" + name.replace(/\W+/g, "_");

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <label for="${id}">
      <input id="${id}" type="checkbox" checked />
      <span>${name}</span>
    </label>
  `;

  layersEl.appendChild(wrap);

  const checkbox = wrap.querySelector("input");

  checkbox.addEventListener("change", () => {
    const layer = overlayLayers[name];
    if (!layer) return;

    if (checkbox.checked) {
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  });
}

// ===============================
// 4) Conversão KML → GeoJSON
// ===============================

function kmlTextToGeoJson(kmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "text/xml");
  return toGeoJSON.kml(xml);
}

// ===============================
// 5) Carregamento de KML
// ===============================

async function loadKml({ url, name, color }) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao carregar ${url}`);

    const text = await res.text();
    const geojson = kmlTextToGeoJson(text);

    console.log("Carregou:", name, "Features:", geojson?.features?.length);

    if (!geojson || !geojson.features || geojson.features.length === 0) {
      console.warn("Sem feições:", name);
      return;
    }

    const layer = L.geoJSON(geojson, {
      filter: (f) => f && f.geometry,

      style: () => ({
        color: color,
        weight: 3,
        opacity: 1,
        fillColor: color,
        fillOpacity: 0.3
      }),

      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.9
        }),

      onEachFeature: (feature, lyr) => {
        const title = feature?.properties?.name || name;
        lyr.bindPopup(`<b>${title}</b>`);
      }
    });

    overlayLayers[name] = layer.addTo(map);

    addLegendItem(name, color);
    addLayerToggle(name);

    try {
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } catch (e) {
      console.warn("Não foi possível ajustar zoom:", name);
    }

  } catch (error) {
    console.error("Erro ao carregar camada:", name, error);
  }
}

// ===============================
// 6) Inicialização das camadas
// ===============================

(async () => {
  await loadKml({
    url: "data/ide_1104_mg_lim_reg_metrop_pol.kml",
    name: "Limite Região Metropolitana",
    color: "#007E7A"
  });

  await loadKml({
    url: "data/ide_1601_mg_zonas_climaticas_pol.kml",
    name: "Zonas Climáticas",
    color: "#ECB11F"
  });
})();
