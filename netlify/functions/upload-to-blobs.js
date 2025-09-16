import { blobs } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Invalid Content-Type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { name, content } = await req.json();

    if (!name || !content) {
      return new Response(JSON.stringify({ error: 'Missing name or content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const decoded = Buffer.from(content, 'base64');

    const store = blobs({ provider: 'fs' }); // uses local fs for dev, Netlify Blobs in prod
    await store.set(`images/${name}`, decoded, {
      metadata: { uploaded: new Date().toISOString() }
    });

    return new Response(JSON.stringify({ success: true, filename: name }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};