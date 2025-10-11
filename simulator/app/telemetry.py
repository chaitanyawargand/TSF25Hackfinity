import asyncio, random
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime

app = FastAPI()

@app.websocket("/ws/telemetry/{mission_id}")
async def telemetry_ws(websocket: WebSocket, mission_id: str):
    await websocket.accept()
    lat, lon, alt, speed, battery = 28.6139, 77.2090, 100, 5, 100
    paused = False
    
    try:
        while True:
            # send telemetry if not paused
            if not paused:
                lat += random.uniform(-0.0001, 0.0001)
                lon += random.uniform(-0.0001, 0.0001)
                alt += random.uniform(-0.5, 0.5)
                speed += random.uniform(-0.2, 0.2)
                battery -= 0.05

                telemetry = {
                    "mission_id": mission_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "lat": round(lat, 6),
                    "lon": round(lon, 6),
                    "altitude": round(alt, 2),
                    "speed": round(speed, 2),
                    "battery": round(battery, 2)
                }

                await websocket.send_json(telemetry)

            # sleep 500ms
            await asyncio.sleep(0.5)

            # check for commands without blocking
            try:
                msg = await asyncio.wait_for(websocket.receive_json(), timeout=0.01)
                cmd = msg.get("command")
                if cmd == "pause":
                    paused = True
                elif cmd == "resume":
                    paused = False
                elif cmd == "abort":
                    break
            except asyncio.TimeoutError:
                # no message received → continue sending telemetry
                pass

    except WebSocketDisconnect:
        print(f"Mission {mission_id} disconnected")
