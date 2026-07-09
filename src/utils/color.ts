import { ColorEntry } from '../types';

export const SYMBOLS = ['■', '□', '▲', '▼', '●', '○', '◆', '◇', '✖', '＋', '★', '✳', '│', '─'];

let _c = 0;
export function uid(): string {
  return `${Date.now().toString(36)}${(++_c).toString(36)}`;
}

export function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const l = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b);
}

export function contrastFor(hex: string) { return luminance(hex) > 0.3 ? '#1a1a1a' : '#ffffff'; }

export function makeColor(hex: string, name: string, symbolIdx = 0): ColorEntry {
  const initials = name.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('').substring(0, 3);
  return { id: uid(), hex, name, symbol: SYMBOLS[symbolIdx % SYMBOLS.length], symbolColor: contrastFor(hex), initials, count: 0 };
}

// Default starter palette (craft-friendly, no neon game colors)
export const STARTER_PALETTE: Omit<ColorEntry, 'id' | 'count'>[] = [
  { hex: '#ffffff', name: 'Blanco',        symbol: '·', symbolColor: '#888' },
  { hex: '#2c2c2c', name: 'Negro',         symbol: '■', symbolColor: '#fff' },
  { hex: '#c0392b', name: 'Rojo carmín',   symbol: '×', symbolColor: '#fff' },
  { hex: '#e74c3c', name: 'Rojo tomate',   symbol: '+', symbolColor: '#fff' },
  { hex: '#e67e22', name: 'Naranja',        symbol: '○', symbolColor: '#fff' },
  { hex: '#f1c40f', name: 'Amarillo',       symbol: '◆', symbolColor: '#333' },
  { hex: '#2ecc71', name: 'Verde menta',   symbol: '▲', symbolColor: '#fff' },
  { hex: '#27ae60', name: 'Verde bosque',  symbol: 'V', symbolColor: '#fff' },
  { hex: '#3498db', name: 'Azul cielo',    symbol: 'T', symbolColor: '#fff' },
  { hex: '#2980b9', name: 'Azul marino',   symbol: 'Λ', symbolColor: '#fff' },
  { hex: '#9b59b6', name: 'Lila',          symbol: '●', symbolColor: '#fff' },
  { hex: '#8e44ad', name: 'Violeta',       symbol: 'S', symbolColor: '#fff' },
  { hex: '#e91e63', name: 'Rosa fucsia',   symbol: '◇', symbolColor: '#fff' },
  { hex: '#f8bbd0', name: 'Rosa palo',     symbol: '△', symbolColor: '#555' },
  { hex: '#795548', name: 'Marrón',        symbol: 'Z', symbolColor: '#fff' },
  { hex: '#bcaaa4', name: 'Beige',         symbol: '□', symbolColor: '#555' },
  { hex: '#607d8b', name: 'Gris pizarra',  symbol: 'N', symbolColor: '#fff' },
  { hex: '#b0bec5', name: 'Gris plata',    symbol: 'M', symbolColor: '#555' },
];

export function buildStarterPalette(): ColorEntry[] {
  return STARTER_PALETTE.map((c, i) => ({ ...c, id: uid(), count: 0 }));
}
