const map = L.map("map").setView([-19.92, -43.94], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

const legendEl = document.getElementById("legend");
const layersEl = document.getElementById("layers");
const overlayLayers = {};

function addLegendItem(name, color) {
  const li = document.createElement("li");
  li.innerHTML = `<span class="swatch" style="background:${color}"></span> ${name}`;
  legendEl.appendChild(li);
}

function addLayerToggle(name) {
  const id = "chk_" + name.replace(/\W+/g, "_");
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <label>
      <input id="${id}" type="checkbox" checked />
      ${name}
    </label>
  `;
  layersEl.appendChild(wrap);

  const checkbox = wrap.querySelector("input");
  checkbox.addEventListener("change", () => {
    const layer = overlayLayers[name];
    if (!layer) return;
    checkbox.checked ? layer.addTo(map) : map.removeLayer(layer);
  });
}

async function loadGeoJSON({ url, name, color }) {
  const res = await fetch(url);
  const data = await res.json();

  const layer = L.geoJSON(data, {
    style: {
      color: color,
      weight: 3,
      fillColor: color,
      fillOpacity: 0.3
    },
    pointToLayer: (f, latlng) =>
      L.circleMarker(latlng, {
        radius: 6,
        color: color,
        fillColor: color,
        fillOpacity: 0.9
      })
  }).addTo(map);

  overlayLayers[name] = layer;
  addLegendItem(name, color);
  addLayerToggle(name);
  map.fitBounds(layer.getBounds());
}

(async () => {
  await loadGeoJSON({
    url: "data/ide_1104_mg_lim_reg_metrop_pol.geojson",
    name: "Limite Região Metropolitana",
    color: "#007E7A"
  });

  await loadGeoJSON({
    url: "data/ide_1601_mg_zonas_climaticas_pol.geojson",
    name: "Zonas Climáticas",
    color: "#ECB11F"
  });
})();

