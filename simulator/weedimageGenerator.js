import fs from "fs";
import path from "path";

export function PickRandomweedImages(allowedExtensions = ["jpg", "png", "jpeg"]) {
    const folderPath="./weedimages";
  if (!fs.existsSync(folderPath)) {
    console.error("Folder does not exist!");
    return null;
  }

  // Get all files with allowed extensions
  const files = fs.readdirSync(folderPath).filter(file => {
    const ext = path.extname(file).toLowerCase().slice(1);
    return allowedExtensions.includes(ext);
  });

  if (files.length === 0) return null;

  // Pick a random index
  const randomIndex = Math.floor(Math.random() * files.length);
  return path.join(folderPath, files[randomIndex]);
}
