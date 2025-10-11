import asyncio
import websockets
import json

async def test_telemetry():
    uri = "ws://localhost:8000/ws/telemetry/test-mission"
    async with websockets.connect(uri) as websocket:
        try:
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                print(data)

                # Example: send pause/resume commands
                # await websocket.send(json.dumps({"command": "pause"}))
                # await asyncio.sleep(2)
                # await websocket.send(json.dumps({"command": "resume"}))
        except KeyboardInterrupt:
            print("Test stopped")

asyncio.run(test_telemetry())
