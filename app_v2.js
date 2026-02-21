document.addEventListener("DOMContentLoaded", function () {

  // ===============================
  // 1) Mapa base
  // ===============================
  const leafletMap = L.map("map", { preferCanvas: true }).setView([-19.92, -43.94], 10);
  window.leafletMap = leafletMap; // ajuda debug

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap'
  }).addTo(leafletMap);

  // ===============================
  // 2) Estado + UI
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
      const lyr = overlayLayers[name];
      if (!lyr) return;
      if (e.target.checked) lyr.addTo(leafletMap);
      else leafletMap.removeLayer(lyr);
    });
  }

  // ===============================
  // 3) Converter KML -> GeoJSON
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
        weight: 2,
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

      // ✅ Clique e tooltip com o nome
      onEachFeature: (feature, lyr) => {
        const props = feature.properties || {};

        const nome =
          props.name ||
          props.Name ||
          props.NOME ||
          props.nome ||
          props.description ||
          "Sem nome";

        lyr.bindPopup(`<strong>${nome}</strong>`);
        lyr.bindTooltip(nome, { sticky: true });
      }
    });

    overlayLayers[name] = layer.addTo(leafletMap);
    addLegendItem(name, color);
    addLayerToggle(name);

    try {
      leafletMap.fitBounds(layer.getBounds(), { padding: [20, 20] });
    } catch {}
  }

  // ===============================
  // 5) Inicialização
  // ===============================
  (async () => {
    try {
      await loadKml({
        url: "data/ide_1601_mg_zonas_climaticas_pol.kml",
        name: "Zonas Climáticas",
        color: "#ECB11F"
      });

      await loadKml({
        url: "data/ide_1104_mg_lim_reg_metrop_pol.kml",
        name: "Limite Região Metropolitana",
        color: "#007E7A"
      });

    } catch (e) {
      console.error(e);
      alert("Erro ao carregar camadas. Veja o console (F12).");
    }
  })();

});
