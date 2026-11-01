import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Adds the 'in' class once the element scrolls into view. No-ops under reduced motion (stays visible). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, className: `reveal ${visible ? 'in' : ''}` }
}

/**
 * Counts a numeric string up from 0 on first reveal, preserving its prefix/suffix
 * (%, −, commas, ms...). A value that isn't a plain numeric string (JSX, "#1",
 * "< 50 ms"...) passes through unchanged. Always calls its hooks, so it is safe
 * to use with a `value` whose type varies by call site.
 */
export function useCountUp(value: ReactNode, active: boolean, duration = 900): ReactNode {
  const [out, setOut] = useState<ReactNode>(value)
  const started = useRef(false)
  useEffect(() => {
    if (typeof value !== 'string') { setOut(value); return }
    const m = /^([^\d]*)([\d,]+)(.*)$/.exec(value)
    if (!m || !active || started.current) { if (!active) setOut(value); return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setOut(value); return }
    started.current = true
    const [, prefix, digits, suffix] = m
    const target = parseInt(digits.replace(/,/g, ''), 10)
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      const n = Math.round(target * eased)
      setOut(`${prefix}${n.toLocaleString()}${suffix}`)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, value, duration])
  return out
}
