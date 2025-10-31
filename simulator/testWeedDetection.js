import fs from "fs";
import { PickRandomweedImages } from "./weedimageGenerator.js";
import { sendImageToFastAPI } from "./getImage.js";

async function main() {
  const imagePath = PickRandomweedImages();
  if (!imagePath) {
    console.error("❌ No image found!");
    return;
  }

  console.log("🪴 Picked Image:", imagePath);

  const { imageBuffer, healthFlag } = await sendImageToFastAPI(imagePath);

  console.log(`✅ Got overlay bytes: ${imageBuffer.length} bytes`);
  console.log(`🩺 Health flag: ${healthFlag}`);

  // Save the overlay image properly as binary
  fs.writeFileSync("overlay_result.png", imageBuffer);

  console.log("💾 Saved overlay to overlay_result.png");
}

main();
