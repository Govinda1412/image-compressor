const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const controls = document.getElementById('controls');
const resultsCard = document.getElementById('results-card');

const qualityInput = document.getElementById('quality');
const qualityVal = document.getElementById('quality-val');
const formatSelect = document.getElementById('format');
const maxWidthSelect = document.getElementById('max-width');

const origImg = document.getElementById('orig-img');
const compImg = document.getElementById('comp-img');
const origSize = document.getElementById('orig-size');
const compSize = document.getElementById('comp-size');
const savedPct = document.getElementById('saved-pct');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

let loadedFile = null;
let sourceImage = null;

// Drag and drop handlers
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

['dragleave', 'dragend'].forEach(type => {
  dropZone.addEventListener(type, () => dropZone.classList.remove('dragover'));
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
});

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(2) + ' MB';
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file.');
    return;
  }
  loadedFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    sourceImage = new Image();
    sourceImage.onload = () => {
      origImg.src = e.target.result;
      origSize.textContent = `Size: ${formatBytes(file.size)}`;

      if (file.type === 'image/webp') formatSelect.value = 'image/webp';
      else if (file.type === 'image/png') formatSelect.value = 'image/png';
      else formatSelect.value = 'image/jpeg';

      controls.style.display = 'grid';
      resultsCard.style.display = 'block';
      compress();
    };
    sourceImage.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function compress() {
  if (!sourceImage) return;

  const quality = parseFloat(qualityInput.value) / 100;
  const format = formatSelect.value;
  const maxWidthChoice = maxWidthSelect.value;

  let { naturalWidth: width, naturalHeight: height } = sourceImage;

  if (maxWidthChoice !== 'original') {
    const maxW = parseInt(maxWidthChoice, 10);
    if (width > maxW) {
      height = Math.round((height * maxW) / width);
      width = maxW;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(sourceImage, 0, 0, width, height);

  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    compImg.src = url;

    compSize.textContent = `Size: ${formatBytes(blob.size)}`;

    const diff = loadedFile.size - blob.size;
    const pct = Math.round((diff / loadedFile.size) * 100);

    if (pct >= 0) {
      savedPct.textContent = `${pct}% Saved`;
      savedPct.className = 'meta-badge saved-badge';
    } else {
      savedPct.textContent = `+${Math.abs(pct)}% (Larger)`;
      savedPct.className = 'meta-badge';
    }

    const ext = format === 'image/webp' ? '.webp' : format === 'image/png' ? '.png' : '.jpg';
    const originalName = loadedFile.name.substring(0, loadedFile.name.lastIndexOf('.')) || 'image';
    downloadBtn.download = `${originalName}-compressed${ext}`;
    downloadBtn.href = url;
  }, format, quality);
}

qualityInput.addEventListener('input', () => {
  qualityVal.textContent = `${qualityInput.value}%`;
  compress();
});

formatSelect.addEventListener('change', compress);
maxWidthSelect.addEventListener('change', compress);

resetBtn.addEventListener('click', () => {
  fileInput.value = '';
  loadedFile = null;
  sourceImage = null;
  controls.style.display = 'none';
  resultsCard.style.display = 'none';
});
