const THUMB_LIMIT = 12;
let currentPage = 1;

fetch("gallery.json")
  .then(res => res.json())
  .then(images => {
    renderPage(images, currentPage);
    setupPagination(images);
  });

function renderPage(images, page) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";
  const start = (page - 1) * THUMB_LIMIT;
  const end = start + THUMB_LIMIT;
  const pageImages = images.slice(start, end);

  pageImages.forEach(async (filename) => {
    const imgPath = `images/${filename}`;
    const thumbPath = `thumbnails/${filename.replace(/\.(png|jpg)$/i, '-thumb.jpg')}`;

try {
  const metadata = await exifr.parse(imgPath, { tiff: true, xmp: true, userComment: true });
  const rawText = metadata?.parameters || metadata?.UserComment || "";

  const prompt = rawText.match(/^(.*?)Steps:/s)?.[1]?.trim() || "No prompt";
  const checkpoint = rawText.match(/Model:\s*([^\n,]+)/)?.[1]?.trim() || "Unknown";
  const loras = [...rawText.matchAll(/<lora:([\w-]+):([\d.]+)>/g)]
    .map(m => `${m[1]} (${m[2]})`)
    .join(', ') || "None";

  const div = document.createElement("div");
  div.className = "thumb";
  div.innerHTML = `
    <a href="${imgPath}" target="_blank">
      <img src="${thumbPath}" alt="${filename}">
    </a>
    <p><strong>Prompt:</strong> ${prompt}</p>
    <p><strong>Checkpoint:</strong> ${checkpoint}</p>
    <p><strong>LoRA:</strong> ${loras}</p>
  `;
  gallery.appendChild(div);
} catch (e) {
  console.error(`Failed to parse metadata from ${filename}`, e);
}
  });
}

function setupPagination(images) {
  const totalPages = Math.ceil(images.length / THUMB_LIMIT);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderPage(images, currentPage);
    };
    pagination.appendChild(btn);
  }
}

// Cache busting trigger
