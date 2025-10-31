import { WebSocketServer } from "ws";
import runCppProgram from "./1.js";
import { PickRandomImage } from "./ImageGenerator.js";
import { PickRandomweedImages } from "./weedimageGenerator.js";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

// Create WebSocket server
const wss = new WebSocketServer({ port: 3000 }, () => {
  console.log("✅ WebSocket server running on ws://localhost:3000");
});

let waypoint = [];
let iterator = 0;
let batteryLevel = 100;
let isPaused = false;
let isAborted = false;

// Broadcast helper
function broadcast(message) {
  const msgString = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(msgString);
    }
  });
}

// Battery drain simulation
function battery() {
  if (batteryLevel <= 0) {
    isAborted = true;
    broadcast({ type: "BATTERY", message: "Battery Over" });
  }
  batteryLevel -= 0.2;
  return batteryLevel;
}

// Degree → minute conversion
function degreesToMinutes(deg) {
  return Math.floor(deg * 60);
}

// Generate telemetry for each waypoint
async function generateTelemetryData() {
  if (isAborted) return;
  if (!waypoint.length || iterator >= waypoint.length) return null;

  const imagePath = PickRandomImage(); // for plant health
  const weedPath = PickRandomweedImages(); // for weed detection

  let prediction = 0;
  let overlayBase64 = null; // plant health overlay
  let weedBase64 = null;    // weed detection overlay

  // 🌿 1️⃣ Send plant image to FastAPI for plant health
  if (imagePath && fs.existsSync(imagePath)) {
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(imagePath), "plant.jpg");

      const response = await axios.post("http://127.0.0.1:8000/predict", formData, {
        headers: formData.getHeaders(),
        responseType: "arraybuffer",
      });

      prediction = parseInt(response.headers["x-health-flag"] || "0", 10);
      const base64Data = Buffer.from(response.data, "binary").toString("base64");
      overlayBase64 = `data:image/png;base64,${base64Data}`;
    } catch (err) {
      console.error("❌ Plant model error:", err.message);
    }
  }

  // 🌾 2️⃣ Send random weed image to FastAPI for weed detection
  if (weedPath && fs.existsSync(weedPath)) {
    try {
      const weedForm = new FormData();
      weedForm.append("file", fs.createReadStream(weedPath), "weed.jpg");

      const weedResponse = await axios.post("http://127.0.0.1:8000/predict", weedForm, {
        headers: weedForm.getHeaders(),
        responseType: "arraybuffer",
      });

      const weedBase64Data = Buffer.from(weedResponse.data, "binary").toString("base64");
      weedBase64 = `data:image/png;base64,${weedBase64Data}`;
    } catch (err) {
      console.error("❌ Weed detection error:", err.message);
    }
  }

  const currentPoint = waypoint[iterator];
  if (!currentPoint) return null;

  const telemetry = {
    timestamp: Date.now(),
    altitude: 2,
    speed: 10,
    battery: battery(),
    lat: currentPoint[0],
    lng: currentPoint[1],
    prediction,
    overlay: overlayBase64,  // plant model
    weedImage: weedBase64,   // weed model
  };

  iterator++;
  return telemetry;
}


// Run C++ map generation and produce waypoints
function generateMap(mission, startTelemetry) {
  let input = `${mission.coords.length} `;

  for (let i = 0; i < mission.coords.length; i++) {
    input += `${degreesToMinutes(mission.coords[i].lat)} ${degreesToMinutes(
      mission.coords[i].lng
    )} `;
  }

  input += "2";

  runCppProgram(input)
    .then((outputChunks) => {
      const outputStr = outputChunks.map((buf) => buf.toString()).join("").trim();
      const flatNumbers = outputStr
        .split(/\s+/)
        .map((n) => parseFloat(n))
        .filter((n) => !isNaN(n));

      waypoint = [];
      for (let i = 0; i < flatNumbers.length; i += 2) {
        const lat = flatNumbers[i] / 60;
        const lng = flatNumbers[i + 1] / 60;
        if (!isNaN(lat) && !isNaN(lng)) waypoint.push([lat, lng]);
      }

      iterator = 0;
      console.log("🗺️ Waypoints generated:", waypoint);

      if (waypoint.length > 0) startTelemetry(mission);
      else console.log("⚠️ No waypoints generated");
    })
    .catch(console.error);
}

// WebSocket handler
wss.on("connection", (ws) => {
  console.log("🛰️ Client connected");
  let currentMission = null;
  let telemetryLoopActive = false;

  const startTelemetry = async (mission) => {
    if (telemetryLoopActive) return;
    telemetryLoopActive = true;

    while (true) {
      if (!isPaused && !isAborted) {
        const telemetry = await generateTelemetryData();
        if (!telemetry) {
          broadcast({ type: "STATUS", message: "Mission complete" });
          telemetryLoopActive = false;
          break;
        }

        broadcast({
          type: "TELEMETRY",
          missionId: mission?.id || null,
          telemetry,
        });
      }

      await new Promise((r) => setTimeout(r, 500));
    }
  };

  ws.on("message", async (message) => {
    try {
      const msg = JSON.parse(message);
      console.log("📩 Received:", msg);

      switch (msg.command) {
        case "NEW_MISSION":
          currentMission = msg.data;
          isAborted = false;
          isPaused = false;
          console.log("🆕 New mission received:", currentMission);
          broadcast({ type: "ACK", message: "Mission received" });
          generateMap(currentMission, startTelemetry);
          break;

        case "PLAY":
          isPaused = false;
          broadcast({ type: "STATUS", message: "Telemetry resumed" });
          break;

        case "PAUSE":
          isPaused = true;
          broadcast({ type: "STATUS", message: "Telemetry paused" });
          break;

        case "ABORT":
          waypoint = [];
          iterator = 0;
          isAborted = true;
          broadcast({ type: "STATUS", message: "Mission aborted" });
          break;

        default:
          console.log("⚠️ Unknown command:", msg);
      }
    } catch (err) {
      console.error("❌ Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
    waypoint = [];
    iterator = 0;
    telemetryLoopActive = false;
  });
});
