import { set } from "@netlify/blobs";

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

    const files = formData.getAll('images');
    if (!files.length) {
      return new Response(JSON.stringify({ error: 'No images uploaded' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const uploaded = await Promise.allSettled(
      files.slice(0, 10).map(async (file) => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
          const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, '_');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `${baseName}_${timestamp}${extension}`;

          await set(filename, arrayBuffer, {
            metadata: {
              contentType: file.type,
            },
          });

          return { status: 'fulfilled', filename };
        } catch (err) {
          return { status: 'rejected', reason: err.message };
        }
      })
    );

    const success = uploaded.filter(u => u.status === 'fulfilled').map(u => u.filename);
    const failed = uploaded.filter(u => u.status === 'rejected').map(u => u.reason);

    return new Response(JSON.stringify({ uploaded: success, errors: failed }), {
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

    return new Response(JSON.stringify({ error: 'Upload failed', details: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};