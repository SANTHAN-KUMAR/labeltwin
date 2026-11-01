// Rasterise label SVG -> canvas/ImageData; decode barcodes back with zxing-wasm (WASM, runs locally).
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader'
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

let prepared = false
function ensureZxing() {
  if (prepared) return
  prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } })
  prepared = true
}

export async function svgToImageData(svg: string, scale = 3): Promise<ImageData> {
  const w = Number(svg.match(/width="([\d.]+)"/)?.[1] ?? 400)
  const h = Number(svg.match(/height="([\d.]+)"/)?.[1] ?? 300)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('SVG rasterisation failed')); img.src = url })
    const c = document.createElement('canvas')
    c.width = Math.round(w * scale); c.height = Math.round(h * scale)
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return ctx.getImageData(0, 0, c.width, c.height)
  } finally { URL.revokeObjectURL(url) }
}

export interface DecodeResult { ok: boolean; format?: string; text?: string; symbologyId?: string; ms: number; error?: string }

export async function decodeImage(img: ImageData | Blob): Promise<DecodeResult[]> {
  ensureZxing()
  const t0 = performance.now()
  try {
    const r = await readBarcodes(img, { formats: ['DataMatrix', 'Code128'], textMode: 'HRI', tryHarder: true, maxNumberOfSymbols: 4 })
    const ms = performance.now() - t0
    if (!r.length) return [{ ok: false, ms, error: 'No barcode found' }]
    return r.map(x => ({ ok: x.isValid, format: x.format, text: x.text, symbologyId: x.symbologyIdentifier, ms }))
  } catch (e) {
    return [{ ok: false, ms: performance.now() - t0, error: (e as Error).message }]
  }
}

export async function decodeSvg(svg: string): Promise<DecodeResult[]> {
  return decodeImage(await svgToImageData(svg, 3))
}
