import asyncio
import websockets
import json

async def main():
    uri = "ws://localhost:8000/ws/telemetry"
    async with websockets.connect(uri) as ws:
        mission_id = input("Enter mission ID: ")
        await ws.send(json.dumps({"mission_id": mission_id}))

        async def sender():
            while True:
                cmd = input("Command (pause/resume/abort): ").strip()
                await ws.send(json.dumps({"command": cmd}))
                if cmd == "abort":
                    break

        async def receiver():
            async for msg in ws:
                print("Received:", msg)

        await asyncio.gather(sender(), receiver())

asyncio.run(main())
