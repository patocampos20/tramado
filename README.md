# Tramado - Professional Textile CAD Suite 🧶

Tramado is a high-performance, web-based and desktop-native CAD (Computer-Aided Design) platform designed specifically for the professional textile industry. It bridges the gap between traditional graphing tools and modern vector graphics, offering full feature parity with industry-standard platforms (like Stitch Fiddle) while integrating advanced engineering workflows.

## 🚀 Key Features

### 1. Advanced Drafting Engine
- **Pixel-Perfect Grid:** High-performance, reactive grid built with SVGs, capable of handling large-scale pattern drafting without lag.
- **Parametric Gauge (Tensión):** The grid visually deforms based on the physical tension gauge (e.g., Crochet 1x1.2, Knitting 1x0.75), ensuring the drawn pattern perfectly matches the final woven aspect ratio.
- **Geometric Tools:** Draw freehand, Bresenham straight lines, perfect rectangles, and ellipses. 
- **Rasterized Text:** Type text and instantly convert it into grid pixels.
- **Magic Wand & Flood Fill:** Global color replacement and boundary-based filling.
- **Advanced Selection:** Copy, cut, paste, mirror (horizontal/vertical), rotate 90°, and delete specific segments.

### 2. Structural & Technical Library (CAD)
- **Technical Symbols Layer:** Independent from the color layer, allows stamping technical instructions (cables, lace, decreases) over colorwork.
- **Customizable Symbol Database:** Includes standard SVG icons for various knitting and crochet stitches.
- **Pattern Resampling:** Scale your drawing proportionally using Nearest-Neighbor resampling, or simply crop/expand the canvas bounds.

### 3. Parametric Garment Generator ✨
- **Intelligent Pattern Generation:** Enter physical measurements (Chest, Length, Armhole, Neck drop/width) and your gauge swatch. Tramado will automatically compute a life-sized grid.
- **Mathematical Shaping:** Utilizes precise elliptical equations for necklines and parabolic curves for armholes, ensuring anatomically correct shaping.

### 4. Production & Export
- **Automated Written Instructions:** Translates the visual grid into row-by-row written knitting/crochet instructions automatically.
- **Print & PDF Generation:** Exports high-resolution PDFs complete with:
  - The actual chart with dynamic row/column coordinate rulers.
  - A professional legend detailing every yarn, its symbol, and total cell count.
  - Estimated material requirements.
- **Customizable Coordinates:** Change numbering direction (Bottom-to-Top, Right-to-Left, etc.) ideal for C2C (Corner-to-Corner) or specific garment panels.

---

## ⌨️ Keyboard Shortcuts & Controls

| Action | Shortcut / Mouse |
| :--- | :--- |
| **Draw / Pencil** | `D` |
| **Eraser** | `E` or `Right-Click` |
| **Flood Fill** | `F` |
| **Magic Wand (Global Replace)**| `W` |
| **Straight Line** | `L` |
| **Select Area** | `S` |
| **Pan / Move Canvas** | `H` or `Middle-Click + Drag` |
| **Eyedropper (Pick Color)** | `Middle-Click` |
| **Stamp Symbol** | `T` |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y` |
| **Zoom In/Out** | `Mouse Wheel` |

> *Selection Options:* Once an area is selected, a floating toolbar allows for Copy, Cut, Paste, Delete, Mirror, and 90° Rotation.

---

## 🛠️ Architecture & Tech Stack

- **Framework:** React 19 + TypeScript + Vite.
- **State Management:** Zustand (Immutability handled efficiently without massive re-renders, enabling fast Undo/Redo).
- **Styling:** Vanilla CSS (`index.css`) utilizing CSS Variables for dynamic theming and high-performance rendering.
- **Desktop Wrapper:** Electron (cross-compilation for native Windows `.exe` support).
- **Exporting:** Client-side HTML-to-Canvas rendering for PDF preparation.

### State Philosophy
The core state holds a `cells` map (Record<string, string>) rather than a 2D array, ensuring sparse matrices (large empty grids) consume minimal memory. Scaling and transformations operate directly on this spatial map.

---

## 📦 Compilation & Deployment

Tramado can be executed in the browser or compiled into a native desktop application.

### Development (Web)
```bash
npm install
npm run dev
```

### Build for Production (Web)
```bash
npm run build
```
Generates a highly optimized bundle in the `/dist` directory.

### Compile for Desktop (Windows Portable .exe)
```bash
npm run electron:build
```
This leverages `electron-builder` to wrap the React application into a native Chromium window. The compiled standalone executable will be located at:
`release/win-unpacked/Tramado.exe`

---

## 🔮 Roadmap
- **Bicubic Interpolation:** Upgrading the canvas scaling algorithm from Nearest-Neighbor for smoother down-sampling of complex imported images.
- **Cloud Synchronization:** Integration with a backend database (e.g., PostgreSQL/Supabase) to store user profiles, remote projects, and custom symbols.
