// Artwork comparison: register proof to approved art (translation search), pixel diff, then classify
// changed regions semantically using the element bounding boxes from the compiler.
import pixelmatch from 'pixelmatch'
import type { El } from './compile'

export interface Region { x: number; y: number; w: number; h: number; pixels: number; element?: string; elementLabel?: string; kind: 'text' | 'barcode' | 'symbol' | 'layout' }
export interface DiffResult { diff: ImageData; changed: number; ratio: number; regions: Region[]; offset: [number, number]; ms: number }

function pad(a: ImageData, w: number, h: number): ImageData {
  if (a.width === w && a.height === h) return a
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.putImageData(a, 0, 0)
  return ctx.getImageData(0, 0, w, h)
}

function shift(a: ImageData, dx: number, dy: number): ImageData {
  const out = new ImageData(a.width, a.height)
  out.data.fill(255)
  for (let y = 0; y < a.height; y++) {
    const sy = y + dy; if (sy < 0 || sy >= a.height) continue
    for (let x = 0; x < a.width; x++) {
      const sx = x + dx; if (sx < 0 || sx >= a.width) continue
      const i = (y * a.width + x) * 4, j = (sy * a.width + sx) * 4
      out.data[i] = a.data[j]; out.data[i + 1] = a.data[j + 1]; out.data[i + 2] = a.data[j + 2]; out.data[i + 3] = 255
    }
  }
  return out
}

/** Coarse registration: find the integer translation minimising mismatch on a downsampled luminance grid. */
function register(a: ImageData, b: ImageData, range = 10): [number, number] {
  const step = 3
  let best: [number, number] = [0, 0], bestScore = Infinity
  for (let dy = -range; dy <= range; dy++) for (let dx = -range; dx <= range; dx++) {
    let s = 0
    for (let y = range; y < a.height - range; y += step) for (let x = range; x < a.width - range; x += step) {
      const i = (y * a.width + x) * 4, j = ((y + dy) * b.width + (x + dx)) * 4
      const la = a.data[i] + a.data[i + 1] + a.data[i + 2], lb = b.data[j] + b.data[j + 1] + b.data[j + 2]
      s += Math.abs(la - lb)
    }
    if (s < bestScore) { bestScore = s; best = [dx, dy] }
  }
  return best
}

export function compareArtwork(approved: ImageData, revised: ImageData, elements: El[], scale: number, doRegister = true): DiffResult {
  const t0 = performance.now()
  const w = Math.max(approved.width, revised.width), h = Math.max(approved.height, revised.height)
  const A = pad(approved, w, h)
  let B = pad(revised, w, h)
  let offset: [number, number] = [0, 0]
  if (doRegister) { offset = register(A, B); if (offset[0] || offset[1]) B = shift(B, offset[0], offset[1]) }
  const diff = new ImageData(w, h)
  const changed = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: 0.12, includeAA: false, alpha: 0.3, diffColor: [230, 57, 70] })
  // grid clustering of changed pixels
  const cell = 6 * scale
  const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell)
  const grid = new Uint32Array(gw * gh)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4
    if (diff.data[i] === 230 && diff.data[i + 1] === 57) grid[Math.floor(y / cell) * gw + Math.floor(x / cell)]++
  }
  const seen = new Uint8Array(gw * gh)
  const regions: Region[] = []
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const k = gy * gw + gx
    if (!grid[k] || seen[k]) continue
    let minx = gx, maxx = gx, miny = gy, maxy = gy, px = 0
    const stack = [k]; seen[k] = 1
    while (stack.length) {
      const c = stack.pop()!; const cx = c % gw, cy = Math.floor(c / gw); px += grid[c]
      minx = Math.min(minx, cx); maxx = Math.max(maxx, cx); miny = Math.min(miny, cy); maxy = Math.max(maxy, cy)
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue
        const n = ny * gw + nx
        if (grid[n] && !seen[n]) { seen[n] = 1; stack.push(n) }
      }
    }
    if (px < 4) continue
    const r = { x: minx * cell / scale, y: miny * cell / scale, w: (maxx - minx + 1) * cell / scale, h: (maxy - miny + 1) * cell / scale }
    // classify by best-overlapping compiler element
    let bestEl: El | undefined, bestOv = 0
    for (const e of elements) {
      const [ex, ey, ew, eh] = e.bbox
      const ov = Math.max(0, Math.min(r.x + r.w, ex + ew) - Math.max(r.x, ex)) * Math.max(0, Math.min(r.y + r.h, ey + eh) - Math.max(r.y, ey))
      if (ov > bestOv) { bestOv = ov; bestEl = e }
    }
    const kind: Region['kind'] = !bestEl ? 'layout' : bestEl.id === 'udi' ? 'barcode' : bestEl.symbol && !['ref', 'lot', 'useBy', 'mfgDate'].includes(bestEl.id) ? 'symbol' : 'text'
    regions.push({ ...r, pixels: px, element: bestEl?.id, elementLabel: bestEl?.label, kind })
  }
  // merge regions belonging to the same element
  const merged = new Map<string, Region>()
  for (const r of regions) {
    const k = r.element ?? `layout-${Math.round(r.x)}-${Math.round(r.y)}`
    const m = merged.get(k)
    if (!m) merged.set(k, { ...r })
    else { const x2 = Math.max(m.x + m.w, r.x + r.w), y2 = Math.max(m.y + m.h, r.y + r.h); m.x = Math.min(m.x, r.x); m.y = Math.min(m.y, r.y); m.w = x2 - m.x; m.h = y2 - m.y; m.pixels += r.pixels }
  }
  return { diff, changed, ratio: changed / (w * h), regions: [...merged.values()].sort((a, b) => b.pixels - a.pixels), offset, ms: performance.now() - t0 }
}

export function imageDataToUrl(d: ImageData): string {
  const c = document.createElement('canvas'); c.width = d.width; c.height = d.height
  c.getContext('2d')!.putImageData(d, 0, 0)
  return c.toDataURL('image/png')
}
