document.getElementById('imageInput').addEventListener('change', handleFiles);
document.getElementById('uploadForm').addEventListener('submit', handleUpload);

let selectedFiles = [];

function handleFiles(event) {
  const preview = document.getElementById('preview');
  preview.innerHTML = '';
  selectedFiles = Array.from(event.target.files).slice(0, 10); // max 10

  selectedFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

async function handleUpload(event) {
  event.preventDefault();
  const status = document.getElementById('status');
  status.textContent = 'Uploading...';

  for (const file of selectedFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const response = await fetch('/.netlify/functions/handle-blob-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name, content: base64 }),
    });

    if (!response.ok) {
      status.textContent = `Failed to upload ${file.name}`;
      return;
    }
  }

  status.textContent = 'All images uploaded successfully!';
  document.getElementById('uploadForm').reset();
  document.getElementById('preview').innerHTML = '';
}