import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function sendImageToFastAPI(imagePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath)); // send as UploadFile

  const response = await axios.post("http://http://127.0.0.1:8000/predict", form, {
    headers: form.getHeaders(),
  });

  return response.data.prediction;
}
