document.addEventListener("DOMContentLoaded", function () {

  // Mapa base
  const map = L.map("map", { preferCanvas: true }).setView([-19.92, -43.94], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const overlayLayers = {};
  const legendEl = document.getElementById("legend");
  const layersEl = document.getElementById("layers");

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

    wrap.querySelector("input").addEventListener("change", (e) => {
      const layer = overlayLayers[name];
      if (!layer) return;
      if (e.target.checked) layer.addTo(map);
      else map.removeLayer(layer);
    });
  }

  function kmlTextToGeoJson(kmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(kmlText, "text/xml");
    return toGeoJSON.kml(xml);
  }

  async function loadKml({ url, name, color }) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao carregar ${url}`);

    const text = await res.text();
    const geojson = kmlTextToGeoJson(text);

    const layer = L.geoJSON(geojson, {
      style: () => ({
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.3
      })
    });

    overlayLayers[name] = layer.addTo(map);
    addLegendItem(name, color);
    addLayerToggle(name);

    try {
      map.fitBounds(layer.getBounds());
    } catch {}
  }

  (async () => {
    try {
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

    } catch (e) {
      console.error(e);
      alert("Erro ao carregar camadas.");
    }
  })();

});

// ===============================
// 2) Elementos da interface
// ===============================
const overlayLayers = {};
const legendEl = document.getElementById("legend");
const layersEl = document.getElementById("layers");

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

  wrap.querySelector("input").addEventListener("change", (e) => {
    const layer = overlayLayers[name];
    if (!layer) return;
    if (e.target.checked) layer.addTo(map);
    else map.removeLayer(layer);
  });
}

// ===============================
// 3) Converter KML -> GeoJSON (toGeoJSON)
// ===============================
function kmlTextToGeoJson(kmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "text/xml");
  return toGeoJSON.kml(xml);
}

// ===============================
// 4) Carregar KML
// ===============================
async function loadKml({ url, name, color }) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url} (HTTP ${res.status})`);

  const text = await res.text();
  const geojson = kmlTextToGeoJson(text);

  console.log("KML:", name, "features:", geojson?.features?.length);

  if (!geojson?.features?.length) {
    console.warn("Sem feições para desenhar:", name);
    return;
  }

  const layer = L.geoJSON(geojson, {
    filter: (f) => f && f.geometry,

    style: () => ({
      color: color,
      weight: 3,
      opacity: 1,
      fillColor: color,
      fillOpacity: 0.25
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
  } catch {
    console.warn("Não foi possível ajustar zoom:", name);
  }
}

// ===============================
// 5) Inicialização (seus KML)
// ===============================
(async () => {
  try {
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
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar camadas. Veja o console (F12).");
  }
})();
