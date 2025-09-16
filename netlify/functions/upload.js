// File: netlify/functions/upload.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
    });
  }

  try {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response('Invalid Content-Type', { status: 400 });
    }

    const { name, content } = await req.json();

    if (!name || !content) {
      return new Response('Missing name or content field', { status: 400 });
    }

    const imagesDir = path.join(__dirname, '../../public/images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const filePath = path.join(imagesDir, name);
    const buffer = Buffer.from(content, 'base64');
    fs.writeFileSync(filePath, buffer);

    return new Response(JSON.stringify({ success: true, filename: name }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Upload failed:', err);
    return new Response('Internal Server Error', {
      status: 500,
    });
  }
};
