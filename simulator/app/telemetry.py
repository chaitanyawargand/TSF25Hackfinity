# app/telemetry_simulator.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import random
import json
from datetime import datetime

app = FastAPI(title="Telemetry Simulator")

mission_states = {}

@app.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    await websocket.accept()
    print("Client connected, waiting for mission_id...")

    try:
        # Wait for client to send initial mission_id
        msg = await websocket.receive_text()
        data = json.loads(msg)
        mission_id = data.get("mission_id")

        if not mission_id:
            await websocket.send_json({"error": "Mission ID required"})
            await websocket.close()
            return

        # Initialize mission state
        mission_states[mission_id] = {"paused": False, "aborted": False}
        state = mission_states[mission_id]

        await websocket.send_json({"status": f"Mission {mission_id} connected"})
        print(f"[{mission_id}] Mission initialized and telemetry starting")

        # Initial telemetry values
        lat, lon, alt, speed, battery = 28.6139, 77.2090, 100, 5, 100

        async def receive_commands():
            try:
                while True:
                    msg = await websocket.receive_text()
                    data = json.loads(msg)
                    cmd = data.get("command", "").lower()

                    if cmd == "pause":
                        state["paused"] = True
                        print(f"[{mission_id}] Paused")
                    elif cmd == "resume":
                        state["paused"] = False
                        print(f"[{mission_id}] Resumed")
                    elif cmd == "abort":
                        state["aborted"] = True
                        print(f"[{mission_id}] Aborted")
                        break
            except WebSocketDisconnect:
                print(f"[{mission_id}] Command channel closed")
                state["aborted"] = True

        # Run command listener concurrently
        cmd_task = asyncio.create_task(receive_commands())

        try:
            while not state["aborted"]:
                if not state["paused"]:
                    lat += random.uniform(-0.0001, 0.0001)
                    lon += random.uniform(-0.0001, 0.0001)
                    alt += random.uniform(-0.5, 0.5)
                    speed += random.uniform(-0.2, 0.2)
                    battery = max(0, battery - 0.05)

                    telemetry = {
                        "mission_id": mission_id,
                        "timestamp": datetime.utcnow().isoformat(),
                        "lat": round(lat, 6),
                        "lon": round(lon, 6),
                        "altitude": round(alt, 2),
                        "speed": round(speed, 2),
                        "battery": round(battery, 2),
                    }

                    await websocket.send_json(telemetry)

                await asyncio.sleep(0.5)

        except WebSocketDisconnect:
            print(f"[{mission_id}] Telemetry disconnected")
        finally:
            cmd_task.cancel()
            mission_states.pop(mission_id, None)
            print(f"[{mission_id}] Session ended")

    except Exception as e:
        print("Error:", e)
        await websocket.close()
