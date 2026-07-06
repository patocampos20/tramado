import { ColorEntry } from '../types';
import { uid, contrastFor, SYMBOLS } from './color';

interface RGB { r: number; g: number; b: number; }

function getDist(c1: RGB, c2: RGB) {
  return Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2);
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function quantize(pixels: Uint8ClampedArray, k: number): RGB[] {
  const samples: RGB[] = [];
  // Max 2000 samples for K-means to be extremely fast regardless of image size
  const pixelCount = pixels.length / 4;
  const skip = Math.max(1, Math.floor(pixelCount / 2000));
  const step = skip * 4;
  
  for (let i = 0; i < pixels.length; i += step) {
    if (pixels[i + 3] < 128) continue;
    samples.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
  }
  
  if (samples.length === 0) return [{ r: 255, g: 255, b: 255 }];
  
  const centers: RGB[] = [];
  for (let i = 0; i < k; i++) {
    centers.push(samples[Math.floor(Math.random() * samples.length)]);
  }

  for (let iter = 0; iter < 10; iter++) {
    const clusters: RGB[][] = Array.from({ length: k }, () => []);
    
    for (const p of samples) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < k; i++) {
        const d = getDist(p, centers[i]);
        if (d < minDist) { minDist = d; minIdx = i; }
      }
      clusters[minIdx].push(p);
    }
    
    let changed = false;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      let sr = 0, sg = 0, sb = 0;
      for (const p of clusters[i]) { sr += p.r; sg += p.g; sb += p.b; }
      const newC = {
        r: Math.round(sr / clusters[i].length),
        g: Math.round(sg / clusters[i].length),
        b: Math.round(sb / clusters[i].length),
      };
      if (newC.r !== centers[i].r || newC.g !== centers[i].g || newC.b !== centers[i].b) changed = true;
      centers[i] = newC;
    }
    if (!changed) break;
  }
  return centers;
}

export function convertImageToPattern(
  img: HTMLImageElement,
  cols: number,
  maxColors: number,
  options: { dithering?: boolean; smoothing?: boolean; gaugeW?: number; gaugeH?: number } = {}
): { cells: Record<string, string>, colors: ColorEntry[], rows: number } {
  const gw = options.gaugeW ?? 1.0;
  const gh = options.gaugeH ?? 1.0;
  
  const imgAspect = img.height / img.width;
  // Calculate rows needed to maintain the visual aspect ratio when rendered with the given gauge
  const rows = Math.max(1, Math.round((imgAspect * cols * gw) / gh));

  const cvs = document.createElement('canvas');
  cvs.width = cols; cvs.height = rows;
  const ctx = cvs.getContext('2d')!;
  
  if (options.smoothing) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  } else {
    ctx.imageSmoothingEnabled = false;
  }
  ctx.drawImage(img, 0, 0, cols, rows);
  
  const imgData = ctx.getImageData(0, 0, cols, rows).data;
  
  // 1. Find dominant colors
  const paletteRGB = quantize(imgData, maxColors);
  
  // 2. Create palette entries
  const colors: ColorEntry[] = paletteRGB.map((rgb, i) => {
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    return {
      id: uid(),
      hex,
      name: `Color ${i + 1}`,
      symbol: SYMBOLS[i % SYMBOLS.length],
      symbolColor: contrastFor(hex),
      count: 0
    };
  });

  // 3. Map pixels to closest palette color
  const cells: Record<string, string> = {};
  
  // Clone imgData if using dithering to diffuse errors
  const data = new Float32Array(imgData);

  const getPx = (x: number, y: number) => {
    const i = (y * cols + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };
  const setPx = (x: number, y: number, rgb: RGB) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    const i = (y * cols + x) * 4;
    data[i] = rgb.r; data[i + 1] = rgb.g; data[i + 2] = rgb.b;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = getPx(c, r);
      if (px.a < 128) continue; // transparent
      
      let minDist = Infinity;
      let closestId = colors[0].id;
      let closestRGB = paletteRGB[0];
      
      for (let i = 0; i < paletteRGB.length; i++) {
        const d = getDist(px, paletteRGB[i]);
        if (d < minDist) { minDist = d; closestId = colors[i].id; closestRGB = paletteRGB[i]; }
      }
      
      cells[`${c},${r}`] = closestId;

      if (options.dithering) {
        const errR = px.r - closestRGB.r;
        const errG = px.g - closestRGB.g;
        const errB = px.b - closestRGB.b;

        const distribute = (x: number, y: number, w: number) => {
          const np = getPx(x, y);
          setPx(x, y, { r: np.r + errR * w, g: np.g + errG * w, b: np.b + errB * w });
        };

        distribute(c + 1, r,     7 / 16);
        distribute(c - 1, r + 1, 3 / 16);
        distribute(c,     r + 1, 5 / 16);
        distribute(c + 1, r + 1, 1 / 16);
      }
    }
  }

  return { cells, colors, rows };
}
