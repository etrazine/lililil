// netlify/functions/handle-uploads.js
import { put } from '@netlify/blobs';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { name, content } = JSON.parse(event.body);

    if (!name || !content) {
      return {
        statusCode: 400,
        body: 'Missing name or content field',
      };
    }

    const buffer = Buffer.from(content, 'base64');

    // Store the image in Netlify Blobs under the "images" bucket
    await put(`images/${name}`, buffer, {
      contentType: 'image/png',
      metadata: {
        uploaded: new Date().toISOString(),
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, filename: name }),
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
}