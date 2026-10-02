const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'prks-auction-items');

async function processImages() {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const tempPath = path.join(dir, 'temp_' + file);
    try {
      console.log(`Trimming ${file}...`);
      await sharp(filePath)
        .trim({ threshold: 0 }) // removes transparent pixels
        .toFile(tempPath);
      
      fs.renameSync(tempPath, filePath);
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
  console.log('Done!');
}

processImages();
