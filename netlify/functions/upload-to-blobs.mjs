import { createBlobs } from "@netlify/blobs";

const blobs = createBlobs();

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
      // file is already a Blob/File in Edge Functions
      // Generate a unique filename to avoid overwriting existing blobs
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = file.name && file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
      const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'upload';
      const uniqueFilename = `${baseName}_${timestamp}_${randomSuffix}${extension}`;

      await blobs.set(uniqueFilename, file, {
        metadata: {
          contentType: file.type,
        },
      });

      uploaded.push(uniqueFilename);
    }

    return new Response(JSON.stringify({ uploaded }), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Blob upload error:", err);
    }
    return new Response(
      JSON.stringify({ error: 'Upload failed', details: err?.message || String(err) }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
};