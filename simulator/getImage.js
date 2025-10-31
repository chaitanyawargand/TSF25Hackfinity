import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export async function sendImageToFastAPI(imagePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));

  // Tell axios to expect binary bytes
  const response = await axios.post("http://127.0.0.1:8000/predict", form, {
    headers: form.getHeaders(),
    responseType: "arraybuffer", // 🔥 THIS IS CRITICAL
  });

  return {
    imageBuffer: Buffer.from(response.data), // binary buffer
    healthFlag: response.headers["x-health-flag"], // optional metadata
  };
}
