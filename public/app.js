
const map = L.map("map", {
  worldCopyJump: true
}).setView([25, 15], 2);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    maxZoom: 18
  }
).addTo(map);

const routeLayer = L.layerGroup().addTo(map);
const markerLayer = L.layerGroup().addTo(map);

let allEvents = [];

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderEvents() {
  const selected = $("typeFilter").value;

  const events = selected === "All"
    ? allEvents
    : allEvents.filter(event => event.type === selected);

  routeLayer.clearLayers();
  markerLayer.clearLayers();

  for (const event of events) {
    const line = L.polyline(
      [event.from, event.to],
      {
        color: event.type === "DDoS" ? "#ff5577" : "#20d9e8",
        weight: 2,
        opacity: 0.8,
        dashArray: "6 8"
      }
    ).addTo(routeLayer);

    line.bindPopup(`
      <b>${escapeHTML(event.type)}</b><br>
      Source: ${escapeHTML(event.source)}<br>
      Target: ${escapeHTML(event.target)}<br>
      <small>Simulated demonstration event</small>
    `);

    L.circleMarker(event.from, {
      radius: 5,
      color: "#ff5577",
      fillColor: "#ff5577",
      fillOpacity: 0.9
    }).addTo(markerLayer);

    L.circleMarker(event.to, {
      radius: 4,
      color: "#20d9e8",
      fillColor: "#20d9e8",
      fillOpacity: 0.9
    }).addTo(markerLayer);
  }

  $("eventFeed").innerHTML = events.slice(0, 50).map(event => `
    <div class="event">
      <span class="event-type">${escapeHTML(event.type)}</span>
      <div><b>${escapeHTML(event.source)}</b></div>
      <div class="muted">to ${escapeHTML(event.target)}</div>
      <div class="muted">
        ${new Date(event.timestamp).toLocaleTimeString()}
      </div>
    </div>
  `).join("") || '<div class="event">No matching events.</div>';

  $("totalEvents").textContent = events.length;
  $("activeThreats").textContent =
    new Set(events.map(event => event.type)).size;
  $("countriesObserved").textContent =
    new Set(events.flatMap(event => [event.source, event.target])).size;
}

async function refreshEvents() {
  try {
    const response = await fetch("/api/events?limit=25");

    if (!response.ok) {
      throw new Error("Event API request failed");
    }

    const data = await response.json();
    allEvents = data.events;

    renderEvents();

    $("lastUpdated").textContent =
      "Updated " + new Date().toLocaleTimeString();
  } catch (error) {
    $("lastUpdated").textContent = "API unavailable";
    console.error(error);
  }
}

$("typeFilter").addEventListener("change", renderEvents);

refreshEvents();
setInterval(refreshEvents, 15000);
