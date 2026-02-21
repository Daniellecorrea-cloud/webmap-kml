// 1) Mapa base
const map = L.map("map", { preferCanvas: true }).setView([-19.92, -43.94], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// 2) Estado das camadas
const overlayLayers = {}; // name -> Leaflet layer
const legendEl = document.getElementById("legend");
const layersEl = document.getElementById("layers");

// 3) Helpers UI
function addLegendItem(name, color) {
  const li = document.createElement("li");
  li.innerHTML = `<span class="swatch" style="background:${color}"></span><span>${name}</span>`;
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
    if (checkbox.checked) layer.addTo(map);
    else map.removeLayer(layer);
  });
}

// 4) Parse KML (texto) -> GeoJSON (toGeoJSON)
function kmlTextToGeoJson(kmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "text/xml");
  return toGeoJSON.kml(xml);
}

// 5) Carregar KML
async function loadKml({ url, name, color }) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url}`);
  const text = await res.text();

  const geojson = kmlTextToGeoJson(text);

  const layer = L.geoJSON(geojson, {
    style: () => ({ color, weight: 3 }),
    pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 6, color, weight: 2 }),
    onEachFeature: (feature, lyr) => {
      const title = feature?.properties?.name || name;
      lyr.bindPopup(`<b>${title}</b>`);
    }
  });

  overlayLayers[name] = layer.addTo(map);
  addLegendItem(name, color);
  addLayerToggle(name);

  // Ajusta zoom para a camada
  try { map.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch {}
}

// 6) Carregar KMZ (zip) -> extrai 1º .kml interno
async function loadKmz({ url, name, color }) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url}`);
  const blob = await res.blob();

  const zip = await JSZip.loadAsync(blob);
  const kmlFileName = Object.keys(zip.files).find(fn => fn.toLowerCase().endsWith(".kml"));
  if (!kmlFileName) throw new Error("KMZ sem arquivo .kml interno.");

  const kmlText = await zip.files[kmlFileName].async("text");
  const geojson = kmlTextToGeoJson(kmlText);

  const layer = L.geoJSON(geojson, {
    style: () => ({ color, weight: 3 }),
    pointToLayer: (f, latlng) => L.circleMarker(latlng, { radius: 6, color, weight: 2 }),
    onEachFeature: (feature, lyr) => {
      const title = feature?.properties?.name || name;
      lyr.bindPopup(`<b>${title}</b>`);
    }
  });

  overlayLayers[name] = layer.addTo(map);
  addLegendItem(name, color);
  addLayerToggle(name);

  try { map.fitBounds(layer.getBounds(), { padding: [20, 20] }); } catch {}
}

// 7) Registre suas camadas aqui
(async () => {
  try {
    await loadKml({ url: "data/ide_1104_mg_lim_reg_metrop_pol.kml", name: "ide_1104_mg_lim_reg_metrop_pol", color: "#007E7A" });
    await loadKmz({ url: "data/ide_1601_mg_zonas_climaticas_pol.km", name: "data/ide_1601_mg_zonas_climaticas_pol", color: "#ECB11F" });
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar camadas. Veja o console (F12).");
  }
})();

