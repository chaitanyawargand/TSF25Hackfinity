from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from predict_plant_health import predict_image
from predict_weed import predict_mask_overlay
import traceback

app = FastAPI()

# Allow CORS (for frontend or WebSocket bridge)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        print(f"📸 Received file: {file.filename}, content_type={file.content_type}")

        # Read file once
        image_bytes = await file.read()

        # Each model gets its own copy of image data
        health_status = predict_image(bytes(image_bytes))
        print(f"🌿 Health prediction: {health_status}")

        # Generate overlay mask
        overlay_bytes = predict_mask_overlay(bytes(image_bytes))
        print(f"🖼️ Overlay generated: {len(overlay_bytes)} bytes")

        # 1 = healthy, 0 = unhealthy
        health_flag = 1 if str(health_status).lower() == "healthy" else 0

        # Return overlay image + header flag
        return Response(
            content=overlay_bytes,
            media_type="image/png",
            headers={"x-health-flag": str(health_flag)},
        )

    except Exception as e:
        print("❌ ERROR in /predict endpoint:")
        traceback.print_exc()
        return {"error": str(e)}
