// netlify/functions/upload-to-blobs.mjs
import { set } from "@netlify/blobs";

// Helper: normalize filenames
function normalizeBaseName(filename) {
  return filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, '_');
}

// Helper: ISO timestamp (sortable, readable)
function formatDate() {
  const now = new Date();
  return now.toISOString().replace(/[-:T]/g, '').slice(0, 15); // YYYYMMDDTHHmmss
}

// Helper: secure random suffix
function generateSecureSuffix() {
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
      return new Response(JSON.stringify({ error: 'No images uploaded' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const results = await Promise.all(images.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const extension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
        const baseName = normalizeBaseName(file.name || 'upload');
        const isoTime = formatDate();
        const randomSuffix = generateSecureSuffix();
        const uniqueFilename = `${baseName}-${isoTime}-${randomSuffix}${extension}`;

        await set(uniqueFilename, arrayBuffer, {
          metadata: { contentType: file.type },
        });

        return { file: file.name, storedAs: uniqueFilename };
      } catch (err) {
        return { file: file.name || 'unknown', error: err.message };
      }
    }));

    const success = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    return new Response(JSON.stringify({ success, failed }), {
      status: failed.length ? 207 : 200, // 207 = Multi-Status
      headers: jsonHeaders,
    });

  } catch (err) {
    console.error("Blob upload error:", {
      error: err,
      method: req.method,
      headers: Object.fromEntries([...req.headers.entries()].map(([k, v]) => [k, k.toLowerCase().includes('auth') ? '[FILTERED]' : v])),
      time: new Date().toISOString(),
    });
    return new Response(
      JSON.stringify({ error: 'Upload failed', details: err?.message || String(err) }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
};