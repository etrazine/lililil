import blobs from '@netlify/blobs';

export default async (req) => {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
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

    const files = formData.getAll("images");
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files found in 'images' field" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // Helper: sanitize and normalize filename
    const normalizeBaseName = (filename) =>
      filename.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9-_]/gi, "_");

    // Helper: secure random suffix
    const generateRandomSuffix = () => {
      const bytes = new Uint8Array(6);
      (globalThis.crypto || require("crypto").webcrypto).getRandomValues(bytes);
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const uploaded = [];

    // Upload all files in parallel and handle errors per file
    await Promise.all(files.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const baseName = normalizeBaseName(file.name || "upload");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const suffix = generateRandomSuffix();
        const extension = file.name?.includes(".")
          ? file.name.substring(file.name.lastIndexOf("."))
          : "";
        const uniqueName = `${baseName}_${timestamp}_${suffix}${extension}`;

        await blobs.set(uniqueName, arrayBuffer, {
          metadata: { contentType: file.type },
        });

        uploaded.push(uniqueName);
      } catch (err) {
        console.error("Failed to upload file:", {
          filename: file.name,
          error: err,
          time: new Date().toISOString(),
        });
      }
    }));

    if (uploaded.length === 0) {
      return new Response(JSON.stringify({ error: "All uploads failed" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, uploaded }), {
      status: 200,
      headers: jsonHeaders,
    });

  } catch (err) {
    console.error("Blob upload error:", {
      error: err,
      method: req.method,
      time: new Date().toISOString(),
    });
    return new Response(
      JSON.stringify({ error: "Upload failed", details: err.message }),
      { status: 500, headers: jsonHeaders }
    );
  }
};