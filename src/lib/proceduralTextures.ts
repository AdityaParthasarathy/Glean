import * as THREE from "three";

// Canvas-drawn textures instead of downloaded image assets — no external
// fetch, no licensing to track, nothing that can 404. Each generator
// returns a fresh THREE.CanvasTexture; callers should wrap calls in
// useMemo so a texture (and its GPU upload) isn't rebuilt every render.

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, repeat: number): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Light tile floor with grout lines and subtle per-tile shade variance. */
export function createTileFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#ece4d0";
  ctx.fillRect(0, 0, 256, 256);

  const tiles = 4;
  const tileSize = 256 / tiles;
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const shade = 220 + Math.floor(Math.random() * 16);
      ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 20})`;
      ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
    }
  }

  ctx.strokeStyle = "#c2b696";
  ctx.lineWidth = 3;
  for (let i = 0; i <= tiles; i++) {
    const p = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(256, p);
    ctx.stroke();
  }

  return toTexture(canvas, 14);
}

/** Cardboard box texture: base color + horizontal corrugation + speckle. */
export function createCardboardTexture(baseColor = "#c9a06a"): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 2;
  for (let y = 4; y < 128; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }

  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
    ctx.fillRect(x, y, 1, 1);
  }

  return toTexture(canvas, 1);
}

/** Brushed steel: vertical streaks of varying opacity over a gray base. */
export function createMetalTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128);
  ctx.fillStyle = "#9c9488";
  ctx.fillRect(0, 0, 128, 128);

  for (let x = 0; x < 128; x += 2) {
    const lighter = Math.random() > 0.5;
    ctx.strokeStyle = lighter
      ? `rgba(255,255,255,${Math.random() * 0.18})`
      : `rgba(0,0,0,${Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }

  return toTexture(canvas, 3);
}

/** Wood grain: warm base with wavering horizontal grain lines. */
export function createWoodTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128);
  ctx.fillStyle = "#8a5a34";
  ctx.fillRect(0, 0, 128, 128);

  for (let y = 0; y < 128; y += 3) {
    ctx.strokeStyle = `rgba(50,26,10,${Math.random() * 0.18})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.2) * 2);
    ctx.lineTo(128, y + Math.sin(y * 0.2 + 2) * 2);
    ctx.stroke();
  }

  return toTexture(canvas, 1.5);
}
