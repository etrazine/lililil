const fileInput = document.getElementById("fileInput");
const previewContainer = document.getElementById("preview");
const uploadBtn = document.getElementById("uploadBtn");
const statusMessage = document.getElementById("status");

let selectedFiles = [];

fileInput.addEventListener("change", () => {
  previewContainer.innerHTML = "";
  selectedFiles = Array.from(fileInput.files).slice(0, 10); // max 10

  selectedFiles.forEach((file, index) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = file.name;
      img.style.width = "100px";
      img.style.margin = "5px";
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

uploadBtn.addEventListener("click", async () => {
  if (!selectedFiles.length) {
    statusMessage.textContent = "Please select up to 10 image files.";
    return;
  }

  statusMessage.textContent = "Uploading...";
  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append("files", file));

  try {
    const res = await fetch("/.netlify/functions/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      statusMessage.textContent = `✅ ${result.message}`;
      fileInput.value = "";
      previewContainer.innerHTML = "";
      selectedFiles = [];
    } else {
      throw new Error(result.error || "Upload failed");
    }
  } catch (err) {
    statusMessage.textContent = `❌ ${err.message}`;
  }
});