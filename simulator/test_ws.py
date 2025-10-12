import asyncio
import websockets
import json

async def main():
    uri = "ws://localhost:8000/ws/telemetry/test123"
    async with websockets.connect(uri) as ws:
        async def sender():
            while True:
                cmd = input("Enter command (pause/resume/abort): ").strip()
                await ws.send(json.dumps({"command": cmd}))
                if cmd == "abort":
                    break

        async def receiver():
            async for msg in ws:
                print("Telemetry:", msg)

        await asyncio.gather(sender(), receiver())

asyncio.run(main())
