const input = document.querySelector('#photo-input');
const preview = document.querySelector('#photo-preview');
const stage = document.querySelector('#photo-stage');
const analyzeButton = document.querySelector('#analyze-button');
const resultCard = document.querySelector('#result-card');

input.addEventListener('change', () => {
  const file = input.files[0];
  if (!file) return;
  preview.src = URL.createObjectURL(file);
  preview.onload = () => { stage.classList.remove('empty'); analyzeButton.disabled = false; resultCard.hidden = true; };
});

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h, s: max ? d / max : 0, v: max };
}

function estimatePh({ h, s, v }) {
  if (v < .12 || s < .12) return { ph: '—', label: 'Foto poco clara', text: 'No se distingue suficiente color. Repite la foto con buena luz y una muestra más concentrada.' };
  if (h < 15 || h >= 345) return { ph: '2–3', label: 'Ácido fuerte', text: 'El tono rojo sugiere una mezcla ácida.' };
  if (h >= 325) return { ph: '4–5', label: 'Ácido', text: 'El rosa o fucsia sugiere una mezcla ácida.' };
  if (h >= 245) return { ph: '6–7', label: 'Cerca de neutro', text: 'El violeta suele indicar una mezcla próxima a pH neutro.' };
  if (h >= 185) return { ph: '8–9', label: 'Básico suave', text: 'El azul sugiere una mezcla ligeramente básica.' };
  if (h >= 75) return { ph: '10–11', label: 'Básico', text: 'El verde sugiere una mezcla básica.' };
  return { ph: '12+', label: 'Muy básico', text: 'El amarillo verdoso sugiere una mezcla muy básica.' };
}

analyzeButton.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  const size = 40;
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const side = Math.min(preview.naturalWidth, preview.naturalHeight);
  ctx.drawImage(preview, (preview.naturalWidth - side) / 2, (preview.naturalHeight - side) / 2, side, side, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 100) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
  }
  r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
  const color = `rgb(${r}, ${g}, ${b})`;
  const result = estimatePh(rgbToHsv(r, g, b));
  document.querySelector('#color-chip').style.background = color;
  document.querySelector('#ph-value').textContent = `pH ${result.ph}`;
  document.querySelector('#ph-label').textContent = result.label;
  document.querySelector('#result-text').textContent = result.text;
  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}
