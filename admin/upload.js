const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const uploadBtn = document.getElementById("uploadBtn");
const statusMsg = document.getElementById("status");

let filesToUpload = [];

fileInput.addEventListener("change", () => {
  preview.innerHTML = "";
  filesToUpload = Array.from(fileInput.files).slice(0, 10); // limit to 10

  filesToUpload.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = file.name;
      img.style.maxWidth = "100px";
      img.style.margin = "0.5rem";
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

uploadBtn.addEventListener("click", async () => {
  if (!filesToUpload.length) {
    alert("Please select images to upload.");
    return;
  }

  statusMsg.textContent = "Uploading...";

  for (const file of filesToUpload) {
    try {
      const reader = new FileReader();

      await new Promise((resolve, reject) => {
        reader.onload = async e => {
          const base64Data = e.target.result.split(',')[1];

          const response = await fetch("/.netlify/functions/upload-blob-upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: file.name,
              content: base64Data
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to upload ${file.name}:`, errorText);
            reject(new Error(errorText));
          } else {
            const json = await response.json();
            console.log(`Uploaded: ${json.filename}`);
            resolve();
          }
        };

        reader.onerror = err => reject(err);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error("Upload error", err);
      statusMsg.textContent = `Error uploading ${file.name}: ${err.message}`;
      return;
    }
  }

  statusMsg.textContent = "Upload complete!";
  fileInput.value = "";
  preview.innerHTML = "";
});