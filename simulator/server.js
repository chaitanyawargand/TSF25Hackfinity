import { WebSocketServer } from "ws";
import runCppProgram from "./1.js";
import { sendImageToFastAPI } from "./getImage.js";
import { PickRandomImage } from "./ImageGenerator.js";
import axios from "axios";

// Create WebSocket server
const wss = new WebSocketServer({ port: 3000 }, () => {
  console.log("✅ WebSocket server running on ws://localhost:3000");
});

let waypoint = [];
let iterator = 0;
let batteryLevel = 100;
let isPaused = false; // Global pause flag
let isAborted=false;

function broadcast(message) {
  const msgString = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(msgString);
    }
  });
}

function battery() {
  if(batteryLevel<=0){
    isAborted=true;
    broadcast({ type: "BATTERY", message: "Battery Over" });
  }
  batteryLevel-=0.2;
  return batteryLevel;
}

function degreesToMinutes(deg) {
  return Math.floor(deg * 60);
}

async function generateTelemetryData() {
  if(isAborted) return;
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

  // Safely get waypoint
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
  };

  iterator++; // increment AFTER safely reading

  return telemetry;
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
    .then((outputChunks) => {
      const outputStr = outputChunks.map((buf) => buf.toString()).join("").trim();

      const flatNumbers = outputStr
        .split(/\s+/)
        .map((n) => parseFloat(n))
        .filter((n) => !isNaN(n));

      // **Update the global waypoint array**
      waypoint = [];
      for (let i = 0; i < flatNumbers.length; i += 2) {
        const lat = flatNumbers[i] / 60; // divide by 120
        const lng = flatNumbers[i + 1] / 60;
        if (!isNaN(lat) && !isNaN(lng)) waypoint.push([lat, lng]);
      }

      iterator = 0; // reset iterator
      console.log("🗺️ Waypoints generated:", waypoint);

      if (waypoint.length > 0) {
        startTelemetry(mission); // call your telemetry/drone function
      } else {
        console.log("⚠️ No waypoints generated");
      }
    })
    .catch(console.error);
}


// --- WebSocket listener ---
wss.on("connection", (ws) => {
  console.log("🛰️ Client connected");

  let currentMission = null;
  let telemetryLoopActive = false;

  // ---- Async telemetry loop ----
  const startTelemetry = async (mission) => {
    if (telemetryLoopActive) return;
    telemetryLoopActive = true;

    while (true) {
      if(!isPaused && !isAborted){
      const telemetry = await generateTelemetryData();
      if (!telemetry) {
        broadcast({ type: "STATUS", message: "Mission complete" });
        telemetryLoopActive = false;
        break;
      }
      // const payload={
      //   id:mission.missionid,
      //   telemetry:[telemetry.lat,telemetry.lng,telemetry.prediction,telemetry.battery]
      // }
      // try{
      //   const response = await axios.post("http://localhost:4000/newflightlog",payload,
      //     { headers: { "Content-Type": "application/json" } }
      //   )
      //   console.log(response);
      // }catch(err){
      //   console.log(err);
      // }
      broadcast({
        type: "TELEMETRY",
        missionId: mission?.id || null,
        telemetry,
      });
    }
      await new Promise((r) => setTimeout(r, 500)); // 0.5 sec delay
    }
  };

  // ---- Message handling ----
  ws.on("message", async(message) => {
    try {
      const msg = JSON.parse(message);
      console.log("📩 Received:", msg);

      switch (msg.command) {
        case "NEW_MISSION":
          currentMission = msg.data;
          isAborted=false;
          isPaused=false;
          console.log("🆕 New mission received:", currentMission);
      //     const payload={
      //     id:field.id,
      //     telemetry:[telemetry.lat,telemetry.lng,telemetry.prediction,telemetry.battery]
      // }
      //     try{
      //     const response = await axios.post("http://localhost:4000/newMission",payload,
      //       { headers: { "Content-Type": "application/json" } }
      //     )
      //     console.log(response);
      //   }catch(err){
      //     console.log(err);
      //   }
          
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
          broadcast({ type: "STA  TUS", message: "Mission aborted" });
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
