const THUMB_LIMIT = 12;
let currentPage = 1;
let allImages = [];
let allMetadata = [];

let keywordFilter = "";
let loraFilter = "";

const keywordInput = document.getElementById("keywordFilter");
const loraSelect = document.getElementById("loraFilter");

keywordInput?.addEventListener("input", (e) => {
  keywordFilter = e.target.value.toLowerCase();
  renderPage(allImages, currentPage);
});

loraSelect?.addEventListener("change", (e) => {
  loraFilter = e.target.value;
  renderPage(allImages, currentPage);
});

fetch("gallery.json")
  .then(res => res.json())
  .then(images => {
    allImages = images;
    preloadMetadata(images).then(() => {
      populateLoraDropdown();
      renderPage(images, currentPage);
      setupPagination(images);
    });
  });

function preloadMetadata(images) {
  const promises = images.map(async (filename, idx) => {
    const imgPath = `images/${filename}`;
    try {
      const metadata = await exifr.parse(imgPath, { tiff: true, xmp: true, userComment: true });
      const rawText = metadata?.parameters || metadata?.UserComment || "";
      const prompt = rawText.match(/^(.*?)Steps:/s)?.[1]?.trim() || "No prompt";
      const checkpoint = rawText.match(/Model:\s*([^\n,]+)/)?.[1]?.trim() || "Unknown";
      const loras = [...rawText.matchAll(/<lora:([\w-]+):([\d.]+)>/g)]
        .map(m => ({ name: m[1], strength: m[2] }));

      allMetadata[idx] = {
        filename,
        prompt,
        checkpoint,
        loras,
        rawText,
      };
    } catch (e) {
      allMetadata[idx] = {
        filename,
        prompt: "",
        checkpoint: "",
        loras: [],
        rawText: ""
      };
      console.error(`Failed to read metadata for ${filename}`, e);
    }
  });
  return Promise.all(promises);
}

function renderPage(images, page) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  const filtered = allMetadata.filter(meta => {
    const keywordMatch = keywordFilter === "" || meta.prompt.toLowerCase().includes(keywordFilter);
    const loraMatch = loraFilter === "" || meta.loras.some(l => l.name === loraFilter);
    return keywordMatch && loraMatch;
  });

  const start = (page - 1) * THUMB_LIMIT;
  const end = start + THUMB_LIMIT;
  const pageImages = filtered.slice(start, end);

  pageImages.forEach((meta) => {
    const { filename, prompt, checkpoint, loras } = meta;
    const imgPath = `images/${filename}`;
    const thumbPath = `thumbnails/${filename.replace(/\.(png|jpg)$/i, '-thumb.jpg')}`;
    const loraString = loras.map(l => `${l.name} (${l.strength})`).join(", ") || "None";

    const div = document.createElement("div");
    div.className = "thumb";
    div.innerHTML = `
      <a href="viewer.html?img=${encodeURIComponent(filename)}" target="_blank">
        <img src="${thumbPath}" alt="${filename}">
      </a>
      <p><strong>Checkpoint:</strong> ${checkpoint}</p>
      <p><strong>LoRA:</strong> ${loraString}</p>
      <details>
        <summary>Show Prompt</summary>
        <p>${prompt.replace(/\n/g, '<br>')}</p>
      </details>
    `;
    gallery.appendChild(div);
  });
}

function setupPagination(images) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const filtered = allMetadata.filter(meta => {
    const keywordMatch = keywordFilter === "" || meta.prompt.toLowerCase().includes(keywordFilter);
    const loraMatch = loraFilter === "" || meta.loras.some(l => l.name === loraFilter);
    return keywordMatch && loraMatch;
  });

  const totalPages = Math.ceil(filtered.length / THUMB_LIMIT);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderPage(allImages, currentPage);
    };
    pagination.appendChild(btn);
  }
}

function populateLoraDropdown() {
  const loraNames = new Set();
  allMetadata.forEach(meta => {
    meta.loras.forEach(l => loraNames.add(l.name));
  });

  [...loraNames].sort().forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    loraSelect.appendChild(opt);
  });
}
