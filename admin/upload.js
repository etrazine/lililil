const form = document.getElementById("upload-form");
const input = document.getElementById("image-input");
const preview = document.getElementById("preview");
const status = document.getElementById("status");

input.addEventListener("change", () => {
  preview.innerHTML = "";
  const files = input.files;

  if (!files.length) return;

  Array.from(files)
    .slice(0, 10)
    .forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement("img");
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const files = input.files;

  if (!files.length) {
    status.textContent = "Please select at least one image.";
    return;
  }

  const formData = new FormData();
  Array.from(files).slice(0, 10).forEach(file => {
    formData.append("images", file);
  });

  status.textContent = "Uploading...";

  try {
    const res = await fetch("/.netlify/functions/upload-to-blobs", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      status.textContent = `✅ Uploaded ${data.uploaded.length} file(s) successfully.`;
    } else {
      status.textContent = `❌ Upload failed: ${data.error || res.statusText}`;
    }
  } catch (err) {
    console.error("Upload error", err);
    status.textContent = "❌ An unexpected error occurred during upload.";
  }
});