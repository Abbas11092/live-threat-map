
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const locations = [
  { country: "United States", lat: 37.09, lng: -95.71 },
  { country: "United Kingdom", lat: 55.37, lng: -3.43 },
  { country: "Pakistan", lat: 30.37, lng: 69.34 },
  { country: "Germany", lat: 51.16, lng: 10.45 },
  { country: "India", lat: 20.59, lng: 78.96 },
  { country: "Japan", lat: 36.20, lng: 138.25 },
  { country: "Brazil", lat: -14.23, lng: -51.92 },
  { country: "Australia", lat: -25.27, lng: 133.77 }
];

const types = ["DDoS", "Web Attack", "Scanner", "Intrusion"];

function makeDemoEvent() {
  const source =
    locations[Math.floor(Math.random() * locations.length)];

  let target = locations[
    Math.floor(Math.random() * locations.length)
  ];

  while (target.country === source.country) {
    target = locations[
      Math.floor(Math.random() * locations.length)
    ];
  }

  return {
    id: `DEMO-${Date.now()}-${Math.random()
      .toString(36).slice(2, 7)}`,
    source: source.country,
    target: target.country,
    from: [source.lat, source.lng],
    to: [target.lat, target.lng],
    type: types[Math.floor(Math.random() * types.length)],
    timestamp: new Date().toISOString(),
    demo: true
  };
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/events", (req, res) => {
  const count = Math.min(
    Math.max(Number(req.query.limit) || 25, 1),
    100
  );

  res.set("Cache-Control", "no-store");

  res.json({
    mode: "demo",
    notice: "Simulated events, not real attack telemetry",
    events: Array.from({ length: count }, makeDemoEvent)
  });
});

app.get("/api/stats", (req, res) => {
  res.json({
    mode: "demo",
    totalEvents: 1284,
    activeThreats: 37,
    countriesObserved: 42
  });
});

app.get("*path", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Threat map server listening on port ${PORT}`);
});



app.get("/api/real-attack-summary", async (req, res) => {
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!token) {
    return res.status(503).json({
      error: "Cloudflare API token is not configured"
    });
  }

  try {
    const response = await fetch(
      "https://api.cloudflare.com/client/v4/radar/attacks/layer7/summary/continent",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    const data = await response.json();

    if (!response.ok || data.success === false) {
      return res.status(502).json({
        error: "Threat intelligence provider request failed"
      });
    }

    res.set("Cache-Control", "public, max-age=60");
    res.json({
      source: "Cloudflare Radar",
      data
    });
  } catch (error) {
    res.status(502).json({
      error: "Unable to retrieve attack summary"
    });
  }
});
