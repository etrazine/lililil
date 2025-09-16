// File: netlify/functions/upload-to-blobs.js
// Purpose: Handles image uploads and stores them in Netlify Blobs

import { blobs } from '@netlify/blobs';

export default async (req, context) => {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('images');

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const uploaded = [];
    for (const file of files.slice(0, 10)) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const key = file.name;
      await blobs.set(key, buffer);
      uploaded.push(key);
    }

    return new Response(JSON.stringify({ success: true, uploaded }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};