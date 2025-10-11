import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import io

WEIGHTS_FILE = "plant_disease_mobilenetv2_weights.pth" 
CLASS_NAMES = ['diseased', 'healthy']
IMAGE_SIZE = 224

def get_model_definition():
    """Defines and returns the MobileNetV2 model architecture."""
    model = models.mobilenet_v2()
    
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, len(CLASS_NAMES))
    
    return model

transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_trained_model(weights_path=WEIGHTS_FILE):
    """Loads the model definition and populates it with trained weights."""
    model = get_model_definition()
    
    try:
        model.load_state_dict(torch.load(weights_path, map_location=torch.device('cpu')))
    except FileNotFoundError:
        print(f"ERROR: Weights file not found at {weights_path}. Check the file name.")
        return None
    except Exception as e:
        print(f"ERROR loading weights: {e}")
        return None
    
    model.eval()
    return model

model = load_trained_model()
if model is not None:
    print(f"Prediction model loaded successfully from {WEIGHTS_FILE}.")


def predict_image(image_bytes: bytes):
    """
    important for backend note:
    Accepts raw image bytes (e.g., from a FastAPI UploadFile), 
    preprocesses, and returns the predicted class name.
    """
    if model is None:
        return "Model not loaded. Check script log for errors."

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        image_tensor = transform(image).unsqueeze(0)
        
        with torch.no_grad():
            outputs = model(image_tensor)
            _, predicted_idx = torch.max(outputs, 1)
        
        return CLASS_NAMES[predicted_idx.item()]

    except Exception as e:
        print(f"Prediction processing error: {e}")
        return f"PREDICTION_FAILED: {e}"


if __name__ == '__main__':
    print("--- Running Local Test ---")

    test_image_path = "sample_test_image.jpg" # agar testing karni ho toh
    
    try:
        with open(test_image_path, "rb") as f:
            image_bytes = f.read()
            prediction = predict_image(image_bytes)
            print(f"Image: {test_image_path}")
            print(f"Predicted class: {prediction}")

    except FileNotFoundError:
        print(f"NOTE: To test, update 'test_image_path' to a valid image file and re-run.")