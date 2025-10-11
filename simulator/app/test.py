import asyncio
import websockets
import json

async def send_commands():
    uri = "ws://localhost:8000/ws/telemetry/test-mission"

    async with websockets.connect(uri) as ws:
        print("Connected to telemetry WebSocket.")
        print("Type 'pause', 'resume', or 'abort' to send commands.")

        while True:
            cmd = input("Command: ").strip().lower()
            if cmd not in ["pause", "resume", "abort"]:
                print("Invalid command. Try again.")
                continue

            await ws.send(json.dumps({"command": cmd}))
            print(f"Sent: {cmd}")

            if cmd == "abort":
                print("Abort sent. Closing command client.")
                break

asyncio.run(send_commands())
