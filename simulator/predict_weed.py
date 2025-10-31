import torch
import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2
import segmentation_models_pytorch as smp
from PIL import Image
from io import BytesIO
import requests

MODEL_WEIGHTS_PATH = "https://github.com/niharika896/TSF25Hackfinity/releases/download/v1.0/unet_50_model.pth"
DEVICE = "cpu"

response = requests.get(MODEL_WEIGHTS_PATH)
response.raise_for_status()

model = smp.Unet("resnet50", encoder_weights=None, in_channels=3, classes=1).to(DEVICE)
model.load_state_dict(torch.load(BytesIO(response.content), map_location=torch.device(DEVICE)))
model.eval()

transform = A.Compose([
    A.Resize(height=256, width=256),
    A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ToTensorV2(),
])

def predict_mask_overlay(image_bytes):
    """
    important for backend note
    Takes image bytes as input, runs segmentation model, 
    returns overlay image bytes (PNG) for backend transmission.
    """
    image_pil = Image.open(BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(image_pil)

    input_tensor = transform(image=image_np)['image'].unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(input_tensor)
        pred_mask = (torch.sigmoid(logits) > 0.5).float().cpu().squeeze(0).squeeze(0)
    pred_mask_np = pred_mask.numpy()

    original_image = image_pil.convert("RGBA")
    colored_mask = np.zeros((*pred_mask_np.shape, 4), dtype=np.uint8)
    colored_mask[pred_mask_np == 1] = [255, 0, 0, 150]  # Red with alpha=150(transparency)
    mask_image = Image.fromarray(colored_mask, 'RGBA')
    mask_image = mask_image.resize(original_image.size)
    overlay_image = Image.alpha_composite(original_image, mask_image)

    output_bytes_io = BytesIO()
    overlay_image.save(output_bytes_io, format="PNG")
    output_bytes_io.seek(0)
    return output_bytes_io.getvalue()