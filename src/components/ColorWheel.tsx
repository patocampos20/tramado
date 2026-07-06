import React, { useRef, useEffect, useState } from 'react';

interface ColorWheelProps {
  color: string; // Hex color
  onChange: (hex: string) => void;
}

// Convert HSL to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert Hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 50];
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export const ColorWheel: React.FC<ColorWheelProps> = ({ color, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hsl, setHsl] = useState<[number, number, number]>(hexToHsl(color));
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setHsl(hexToHsl(color));
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy);

    ctx.clearRect(0, 0, w, h);
    
    // Draw wheel
    for (let angle = 0; angle < 360; angle++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, (angle - 1) * Math.PI / 180, (angle + 1) * Math.PI / 180);
      ctx.closePath();
      
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `hsl(${angle}, 0%, ${hsl[2]}%)`); // Center is gray based on lightness
      grad.addColorStop(1, `hsl(${angle}, 100%, ${hsl[2]}%)`);
      
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw selector
    const hue = hsl[0];
    const sat = hsl[1];
    const selR = radius * (sat / 100);
    const selX = cx + selR * Math.cos(hue * Math.PI / 180);
    const selY = cy + selR * Math.sin(hue * Math.PI / 180);
    
    ctx.beginPath();
    ctx.arc(selX, selY, 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(selX, selY, 7, 0, 2 * Math.PI);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsl]);

  const handlePointer = (e: React.PointerEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy);
    
    let dx = x - cx;
    let dy = y - cy;
    let dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
      dist = radius;
    }
    
    let hue = Math.atan2(dy, dx) * 180 / Math.PI;
    if (hue < 0) hue += 360;
    
    const sat = Math.round((dist / radius) * 100);
    
    const newHex = hslToHex(hue, sat, hsl[2]);
    onChange(newHex);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
      <canvas 
        ref={canvasRef}
        width={200}
        height={200}
        style={{ cursor: 'crosshair', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          setIsDragging(true);
          handlePointer(e);
        }}
        onPointerMove={(e) => {
          if (isDragging) handlePointer(e);
        }}
        onPointerUp={(e) => {
          setIsDragging(false);
          (e.target as Element).releasePointerCapture(e.pointerId);
        }}
      />
      
      <div style={{ width: '100%' }}>
        <label style={{ fontSize: 11, fontWeight: 'bold' }}>Brillo / Luminosidad</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={hsl[2]} 
          onChange={e => onChange(hslToHex(hsl[0], hsl[1], parseInt(e.target.value)))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};
