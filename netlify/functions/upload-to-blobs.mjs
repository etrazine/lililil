import blobs from "@netlify/blobs";

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
    const images = formData.getAll('images');

    if (!images || !images.length) {
      return new Response(JSON.stringify({ error: 'No images uploaded' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const uploaded = [];

    for (const file of images) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = file.name;

      await blobs.set(filename, buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      uploaded.push(filename);
    }

    return new Response(JSON.stringify({ success: true, uploaded }), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (err) {
    console.error("Blob upload error:", err);
    return new Response(JSON.stringify({ error: 'Upload failed', details: err.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};