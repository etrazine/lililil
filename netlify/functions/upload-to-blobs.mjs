// netlify/functions/upload-to-blobs.mjs
import { createClient } from '@netlify/blobs';

const blobs = createClient();

function normalizeBaseName(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, '_');
}

export default async (req) => {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const formData = await req.formData();

    if (!formData.has("images")) {
      return new Response(JSON.stringify({ error: "Expected form field 'images' for file uploads" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const images = formData.getAll("images");
    if (!images.length) {
      return new Response(JSON.stringify({ error: "No images uploaded" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const uploaded = [];

    await Promise.all(
      images.map(async (file) => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const extension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
          const baseName = normalizeBaseName(file.name);
          const uniqueFilename = `${baseName}_${timestamp}_${randomSuffix}${extension}`;

          await blobs.set(uniqueFilename, arrayBuffer, {
            metadata: {
              contentType: file.type,
            },
          });

          uploaded.push(uniqueFilename);
        } catch (fileErr) {
          uploaded.push({ file: file.name || 'unknown', error: fileErr.message });
        }
      })
    );

    return new Response(JSON.stringify({ uploaded }), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (err) {
    console.error("Blob upload error:", {
      error: err,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      time: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      error: 'Upload failed',
      details: err.message || String(err)
    }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};