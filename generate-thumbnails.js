// Run this with: node generate-thumbnails.js
const sharp = require('sharp');
const fs = require('fs');

const imageDir = './images/';
const thumbDir = './thumbnails/';
const galleryJsonPath = './gallery.json';

if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir);

const files = fs.readdirSync(imageDir).filter(file => file.match(/\.(png|jpg|jpeg)$/i));

const galleryList = [];

(async () => {
  for (const file of files) {
    const source = imageDir + file;
    const thumb = thumbDir + file.replace(/\.(png|jpg|jpeg)$/i, '-thumb.jpg');
    await sharp(source).resize({ width: 300 }).toFile(thumb);
    galleryList.push(file);
    console.log(`✅ Created thumbnail: ${file}`);
  }

  fs.writeFileSync(galleryJsonPath, JSON.stringify(galleryList, null, 2));
  console.log(`✅ Gallery list written to ${galleryJsonPath}`);
})();