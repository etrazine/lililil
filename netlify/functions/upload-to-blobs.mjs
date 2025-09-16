import { setBlob } from "@netlify/blobs";

function normalizeBaseName(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, '_');
}

function generateRandomSuffix() {
  const randomBytes = new Uint8Array(6);
  (globalThis.crypto || require('crypto').webcrypto).getRandomValues(randomBytes);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
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

    if (!formData.has('images')) {
      return new Response(JSON.stringify({ error: "Expected form field 'images'" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const images = formData.getAll('images');
    if (!images.length) {
      return new Response(JSON.stringify({ error: "No files uploaded." }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const uploaded = [];

    // Upload in parallel
    const uploadPromises = images.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const contentType = file.type;
      const baseName = normalizeBaseName(file.name || `upload`);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const randomSuffix = generateRandomSuffix();
      const extension = file.name?.match(/\.[^/.]+$/)?.[0] || '';
      const uniqueFilename = `${baseName}_${timestamp}_${randomSuffix}${extension}`;

      await setBlob(uniqueFilename, arrayBuffer, {
        metadata: { contentType }
      });

      uploaded.push(uniqueFilename);
    });

    await Promise.all(uploadPromises);

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
      details: err?.message || String(err)
    }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};