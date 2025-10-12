import { WebSocketServer } from "ws";
import runCppProgram from "./1.js";
import { sendImageToFastAPI } from "./getImage.js";
import { PickRandomImage } from "./ImageGenerator.js";
// Create WebSocket server
const wss = new WebSocketServer({ port: 3000 }, () => {
  console.log("✅ WebSocket server running on ws://localhost:3000");
});

let waypoint = [];
let iterator = 0;
let batteryLevel = 100;

function broadcast(message) {
  const msgString = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(msgString);
    }
  });
}


function battery() {
  batteryLevel = Math.max(0, batteryLevel - 1);
  return batteryLevel;
}

function degreesToMinutes(deg) {
  return Math.floor(deg * 60);
}

async function generateTelemetryData() {
  if (!waypoint.length || iterator >= waypoint.length) return null;

  const image = PickRandomImage();
  let prediction = 0;
  if (image) {
    try {
      prediction = await sendImageToFastAPI(image);
    } catch (err) {
      console.error("❌ FastAPI error:", err);
    }
  }
  return {
    timestamp: Date.now(),
    altitude: 2,
    speed: 10,
    battery: battery(),
    lat: waypoint[iterator][0],
    lng: waypoint[iterator++][1],
    prediction,
  };
}

function generateMap(mission, startTelemetry) {
  let input = `${mission.coords.length} `;
  for (let i = 0; i < mission.coords.length; i++) {
    input += `${degreesToMinutes(mission.coords[i].lat)} ${degreesToMinutes(
      mission.coords[i].lng
    )} `;
  }
  input += "2";

  runCppProgram(input)
    .then((output) => {
      waypoint = output;
      iterator = 0;
      console.log("🗺️ Waypoints generated:", waypoint);
      startTelemetry(mission);
    })
    .catch(console.error);
}

wss.on("connection", (ws) => {
  console.log("🛰️ Client connected");

  let currentMission = null;
  let telemetryLoopActive = false;

  // ---- Async telemetry loop ----
  const startTelemetry = async (mission) => {
    if (telemetryLoopActive) return;
    telemetryLoopActive = true;

    while (true) {
      // if (!mission || isPaused) {
      //   await new Promise((r) => setTimeout(r, 500));
      //   continue;
      // }

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

      await new Promise((r) => setTimeout(r, 500)); // 0.5 sec delay
    }
  };

  // ---- Message handling ----
  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message);
      console.log("📩 Received:", msg);

      switch (msg.command) {
        case "NEW_MISSION":
          currentMission = msg.data;
          console.log("🆕 New mission received:", currentMission);
          broadcast({ type: "ACK", message: "Mission received" });
          generateMap(currentMission, startTelemetry);
          break;

        case "Play":
          isPaused = false;
          broadcast({ type: "STATUS", message: "Telemetry resumed" });
          break;

        case "Pause":
          isPaused = true;
          broadcast({ type: "STATUS", message: "Telemetry paused" });
          break;

        case "Abort":
          waypoint = [];
          iterator = 0;
          isPaused = true;
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
    iterator = 0
    telemetryLoopActive = false;
  });
});
