const WebSocket = require("ws");
import runCppProgram from "./1.js";
import { sendImageToFastAPI } from "./getImage.js";
import {pickRandomImage} from "./ImageGenerator.js";
// Create WebSocket server
const wss = new WebSocket.Server({ port: 3000 }, () => {
  console.log("WebSocket server running on ws://localhost:3000");
});
let waypoint = [];
let iterator=0;
let batteryLevel=100;

function battery(){
    batteryLevel--;
    return batteryLevel;
}



function generateTelemetryData() {
  return {
    timestamp: Date.now(),
    altitude:2,
    speed: 10,
    battery: battery(),
    lat:waypoint[iterator][0],
    lng:waypoint[iterator++][1],
    bool:sendImageToFastAPI(pickRandomImage())
  };
}

function degreesToMinutes(deg) {
  return Math.floor(deg*60);
}

function generateMap(mission){
    const input = `${mission.coords.length} `;
    for(i=0;i<mission.coords.length;i++){
        input+=`${degreesToMinutes(mission.coords[i].lat)} ${degreesToMinutes(mission.coords[i].lng)} `;
    }
    input+="2";
    runCppProgram(input).then((output)=>{
        waypoint=output;
        startTelemetry(mission);
    }).catch(console.err);
}

// Function to start sending telemetry data
const startTelemetry = (currentMission) => {
if (telemetryInterval) clearInterval(telemetryInterval);
telemetryInterval = setInterval(() => {
  if (!isPaused) {
    const data = {
      type: "TELEMETRY",
      missionId: currentMission?.id || null,
      telemetry: generateTelemetryData(),
    };
    ws.send(JSON.stringify(data));
  }
}, 500); // every 0.5 seconds
};


wss.on("connection", (ws) => {
  console.log("Client connected");

  let telemetryInterval = null;
  let currentMission = null;
  let isPaused = false;



  // Handle incoming messages
  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message);
      console.log("📩 Received:", msg);

      switch (msg.command) {
        case "NEW_MISSION":
          currentMission = msg.data;
          console.log("🛰 New mission received:", currentMission);
          ws.send(JSON.stringify({ type: "ACK", message: "Mission received" }));
        //   startTelemetry(currentMission);
        generateMap(currentMission);
          break;

        case "Play":
          isPaused = false;
          console.log("▶️ Resumed telemetry");
          ws.send(JSON.stringify({ type: "STATUS", message: "Telemetry resumed" }));
          break;

        case "Pause":
          isPaused = true;
          console.log("⏸ Telemetry paused");
          ws.send(JSON.stringify({ type: "STATUS", message: "Telemetry paused" }));
          break;

        case "Abort":
          console.log("⛔ Mission aborted");
          clearInterval(telemetryInterval);
          ws.send(JSON.stringify({ type: "STATUS", message: "Mission aborted" }));
          break;

        default:
          console.log("⚠️ Unknown command:", msg);
      }
    } catch (err) {
      console.error("❌ Error parsing message:", err);
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    console.log("❌ Client disconnected");
    clearInterval(telemetryInterval);
  });
});
