const WebSocket = require("ws");

// Create WebSocket server
const wss = new WebSocket.Server({ port: 3000 }, () => {
  console.log("WebSocket server running on ws://localhost:3000");
});

// Sample function to generate fake telemetry data
function generateTelemetryData() {
  return {
    timestamp: Date.now(),
    altitude: (Math.random() * 100).toFixed(2),
    speed: (Math.random() * 20).toFixed(2),
    battery: (80 + Math.random() * 20).toFixed(1),
    temperature: (20 + Math.random() * 10).toFixed(1),
  };
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  let telemetryInterval = null;
  let currentMission = null;
  let isPaused = false;
    const iteration=0;
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
        iteration++;
      }
    }, 500); // every 0.5 seconds
  };

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
          startTelemetry(currentMission);
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
