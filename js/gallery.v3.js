const THUMB_LIMIT = 12;
let currentPage = 1;
let parsedImages = [];
let activeKeyword = "";
let activeLora = "";

// 1. Load image list and parse metadata
fetch("gallery.json")
  .then(res => res.json())
  .then(filenames => Promise.all(filenames.map(parseImageMetadata)))
  .then(results => {
    parsedImages = results.filter(Boolean); // Remove failed loads
    renderPage(currentPage);
    setupPagination();
    populateLoraFilter();
  });

// 2. Extract metadata from a single image
async function parseImageMetadata(filename) {
  const imgPath = `images/${filename}`;
  try {
    const metadata = await exifr.parse(imgPath, { tiff: true, xmp: true, userComment: true });
    const rawText = metadata?.parameters || metadata?.UserComment || "";

    return {
      filename,
      prompt: rawText.match(/^(.*?)Steps:/s)?.[1]?.trim() || "",
      checkpoint: rawText.match(/Model:\s*([^\n,]+)/)?.[1]?.trim() || "Unknown",
      loras: [...rawText.matchAll(/<lora:([\w-]+):/g)].map(m => m[1]) || [],
    };
  } catch (e) {
    console.warn(`Failed to read metadata from ${filename}`, e);
    return null;
  }
}

// 3. Render current page based on filters
function renderPage(page) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  const filtered = parsedImages.filter(img => {
    const keywordMatch = !activeKeyword || img.prompt.toLowerCase().includes(activeKeyword.toLowerCase());
    const loraMatch = !activeLora || img.loras.includes(activeLora);
    return keywordMatch && loraMatch;
  });

  const start = (page - 1) * THUMB_LIMIT;
  const end = start + THUMB_LIMIT;
  const pageItems = filtered.slice(start, end);

  pageItems.forEach(img => {
    const thumbPath = `thumbnails/${img.filename.replace(/\.(png|jpg)$/i, '-thumb.jpg')}`;
    const fullImgPath = `images/${img.filename}`;

    const div = document.createElement("div");
    div.className = "thumb";
    div.innerHTML = `
      <a href="viewer.html?img=${img.filename}" target="_blank">
        <img src="${thumbPath}" alt="${img.filename}">
      </a>
      <p><strong>Checkpoint:</strong> ${img.checkpoint}</p>
      <p><strong>LoRA:</strong> ${img.loras.join(", ") || "None"}</p>
    `;
    gallery.appendChild(div);
  });

  setupPagination(filtered.length);
}

// 4. Set up pagination buttons
function setupPagination(total = parsedImages.length) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";
  const totalPages = Math.ceil(total / THUMB_LIMIT);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderPage(currentPage);
    };
    if (i === currentPage) btn.disabled = true;
    pagination.appendChild(btn);
  }
}

// 5. Populate LoRA dropdown
function populateLoraFilter() {
  const loraSet = new Set();
  parsedImages.forEach(img => img.loras.forEach(l => loraSet.add(l)));

  const select = document.getElementById("loraFilter");
  loraSet.forEach(lora => {
    const option = document.createElement("option");
    option.value = lora;
    option.textContent = lora;
    select.appendChild(option);
  });
}

// 6. Filter event listeners
document.getElementById("keywordFilter").addEventListener("input", e => {
  activeKeyword = e.target.value.trim();
  currentPage = 1;
  renderPage(currentPage);
});

document.getElementById("loraFilter").addEventListener("change", e => {
  activeLora = e.target.value.trim();
  currentPage = 1;
  renderPage(currentPage);
});
