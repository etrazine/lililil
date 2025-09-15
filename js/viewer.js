const params = new URLSearchParams(window.location.search);
const filename = params.get("img");

if (!filename) {
  document.body.innerHTML = "<p>No image specified.</p>";
  throw new Error("Missing image filename in URL");
}

const imgPath = `images/${filename}`;

const img = document.createElement("img");
img.src = imgPath;
img.alt = filename;
img.style.maxWidth = "100%";
img.style.display = "block";
img.style.margin = "0 auto 2rem auto";

document.body.appendChild(img);

// Display metadata
(async () => {
  try {
    const metadata = await exifr.parse(imgPath, { tiff: true, xmp: true, userComment: true });
    const rawText = metadata?.parameters || metadata?.UserComment || "";

    const prompt = rawText.match(/^(.*?)Steps:/s)?.[1]?.trim() || "No prompt";
    const checkpoint = rawText.match(/Model:\s*([^\n,]+)/)?.[1]?.trim() || "Unknown";
    const loras = [...rawText.matchAll(/<lora:([\w-]+):([\d.]+)>/g)].map(m => `${m[1]} (${m[2]})`).join(', ') || "None";

    const metaDiv = document.createElement("div");
    metaDiv.innerHTML = `
      <p><strong>Prompt:</strong><br>${prompt.replace(/\n/g, "<br>")}</p>
      <p><strong>Checkpoint:</strong> ${checkpoint}</p>
      <p><strong>LoRA:</strong> ${loras}</p>
    `;
    document.body.appendChild(metaDiv);
  } catch (e) {
    console.error("Error reading image metadata:", e);
    const errorMsg = document.createElement("p");
    errorMsg.textContent = "Failed to read metadata.";
    document.body.appendChild(errorMsg);
  }
})();
