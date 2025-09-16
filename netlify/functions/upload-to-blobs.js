// File: netlify/functions/upload-to-blobs.js
import { blobs } from '@netlify/blobs';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
    });
  }

  const contentType = req.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return new Response('Expected multipart/form-data', { status: 400 });
  }

  const formData = await req.formData();
  const files = formData.getAll('images');

  if (!files.length) {
    return new Response('No files uploaded', { status: 400 });
  }

  const store = blobs.createStore('images'); // auto-creates store if not exists
  const results = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = file.name;

    await store.set(key, buffer, {
      metadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    results.push({ filename: key });
  }

  return new Response(JSON.stringify({ success: true, uploaded: results }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
};