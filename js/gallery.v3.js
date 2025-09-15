const THUMB_LIMIT = 12;
let currentPage = 1;
let allImages = [];
let activeKeyword = "";
let activeLora = "";

// Load images
fetch("gallery.json")
  .then(res => res.json())
  .then(images => {
    allImages = images;
    renderPage(currentPage);
    setupPagination();
    populateLoraFilter(); // Load LoRA options
  });

// Render gallery
function renderPage(page) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  const filteredImages = allImages.filter(filename => {
    const meta = filename.toLowerCase();
    const matchesKeyword = !activeKeyword || meta.includes(activeKeyword.toLowerCase());
    const matchesLora = !activeLora || meta.includes(activeLora.toLowerCase());
    return matchesKeyword && matchesLora;
  });

  const start = (page - 1) * THUMB_LIMIT;
  const end = start + THUMB_LIMIT;
  const pageImages = filteredImages.slice(start, end);

  pageImages.forEach(async (filename) => {
    const imgPath = `images/${filename}`;
    const thumbPath = `thumbnails/${filename.replace(/\.(png|jpg)$/i, '-thumb.jpg')}`;

    try {
      const metadata = await exifr.parse(imgPath, { tiff: true, xmp: true, userComment: true });
      const rawText = metadata?.parameters || metadata?.UserComment || "";

      const prompt = rawText.match(/^(.*?)Steps:/s)?.[1]?.trim() || "";
      const checkpoint = rawText.match(/Model:\s*([^\n,]+)/)?.[1]?.trim() || "Unknown";
      const loras = [...rawText.matchAll(/<lora:([\w-]+):([\d.]+)>/g)].map(m => `${m[1]} (${m[2]})`);

      const div = document.createElement("div");
      div.className = "thumb";
      div.innerHTML = `
        <a href="viewer.html?img=${filename}" target="_blank">
          <img src="${thumbPath}" alt="${filename}">
        </a>
        <p><strong>Checkpoint:</strong> ${checkpoint}</p>
        <p><strong>LoRA:</strong> ${loras.join(", ") || "None"}</p>
      `;
      gallery.appendChild(div);
    } catch (e) {
      console.error(`Failed to parse metadata from ${filename}`, e);
    }
  });

  setupPagination(filteredImages.length);
}

// Pagination
function setupPagination(total = allImages.length) {
  const totalPages = Math.ceil(total / THUMB_LIMIT);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderPage(currentPage);
    };
    if (i === currentPage) {
      btn.disabled = true;
    }
    pagination.appendChild(btn);
  }
}

// Populate the LoRA filter dropdown
async function populateLoraFilter() {
  const loraSet = new Set();

  for (const filename of allImages) {
    const imgPath = `images/${filename}`;
    try {
      const metadata = await exifr.parse(imgPath, { tiff: true, xmp: true, userComment: true });
      const rawText = metadata?.parameters || metadata?.UserComment || "";
      const matches = [...rawText.matchAll(/<lora:([\w-]+):/g)];
      matches.forEach(match => loraSet.add(match[1]));
    } catch (e) {
      console.warn(`Metadata read failed for ${filename}`);
    }
  }

  const loraFilter = document.getElementById("loraFilter");
  [...loraSet].sort().forEach(lora => {
    const option = document.createElement("option");
    option.value = lora;
    option.textContent = lora;
    loraFilter.appendChild(option);
  });
}

// Event listeners for filters
document.getElementById("keywordFilter").addEventListener("input", (e) => {
  activeKeyword = e.target.value.trim();
  currentPage = 1;
  renderPage(currentPage);
});

document.getElementById("loraFilter").addEventListener("change", (e) => {
  activeLora = e.target.value.trim();
  currentPage = 1;
  renderPage(currentPage);
});
