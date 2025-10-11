from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS if Node.js frontend/backend is on a different port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accepts an uploaded file via form-data,
    reads bytes, runs your model, returns prediction.
    """
    # Read image bytes
    image_bytes = await file.read()
    
    # Call your predictor
    result = predict_image(image_bytes)  # returns class name
    
    # Optionally, convert to yes/no
    yes_no = "yes" if result == "Car" else "no"  # example mapping
    
    return {"prediction": yes_no}
