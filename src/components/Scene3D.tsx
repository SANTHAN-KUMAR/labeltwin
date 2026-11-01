import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Full-bleed hero scene: loose label panels (Connect) drift together into an
 * aligned stack (Compile), a scan plane sweeps it (Verify), then a checkmark
 * drawn as a tube along an explicit 3-point path resolves in front, with a
 * soft glow behind it (Prove). Runs once with a slow camera dolly-in, then
 * idles with a gentle drift. Dark background by design: this is the video-
 * like backdrop behind the hero copy, not a boxed decoration beside it.
 */
export default function Scene3D() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // On a wide hero (desktop: text left, visual right) the stack sits
    // off-centre to the right so it never overlaps the copy column. On a
    // narrow/short hero (mobile: visual stacked above the copy, full width)
    // there is no text to avoid, so it sits centred instead.
    const centered = host.clientWidth / Math.max(host.clientHeight, 1) < 1.3
    const stackXOffset = centered ? 0 : 1.35

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60)
    const camStart = new THREE.Vector3(stackXOffset + 0.05, 1.3, 11)
    const camEnd = new THREE.Vector3(stackXOffset * 0.5, 0.45, 7.6)
    const lookAt = new THREE.Vector3(stackXOffset * 0.65, 0.2, 0)
    camera.position.copy(camStart)
    camera.lookAt(lookAt)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0b0d12, 1)
    host.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const ACCENT = 0x5b82ff, WHITE = 0xf3f5fa, STEEL = 0x3a3f4c
    const PW = 2.6, PH = 1.5
    const COUNT = 9
    const panelGeo = new THREE.BoxGeometry(PW, PH, 0.04)
    const panels: THREE.Mesh[] = []
    const start: { pos: THREE.Vector3; rot: THREE.Euler }[] = []
    const target: { pos: THREE.Vector3; rot: THREE.Euler }[] = []

    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: i % 4 === 0 ? ACCENT : i % 4 === 1 ? WHITE : STEEL,
        roughness: 0.45, metalness: 0.15, transparent: true, opacity: 0.97,
      })
      const mesh = new THREE.Mesh(panelGeo, mat)
      const rand = (n: number) => (Math.random() - 0.5) * n
      start.push({ pos: new THREE.Vector3(rand(13) - 1, rand(7), rand(6) - 2), rot: new THREE.Euler(rand(3), rand(3), rand(3)) })
      const z = (i - (COUNT - 1) / 2) * 0.075
      target.push({ pos: new THREE.Vector3(stackXOffset, 0.3, z), rot: new THREE.Euler(0, 0, 0) })
      mesh.position.copy(start[i].pos)
      mesh.rotation.copy(start[i].rot)
      group.add(mesh)
      panels.push(mesh)
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    const key = new THREE.DirectionalLight(0xffffff, 1.3)
    key.position.set(3, 5, 6)
    const rim = new THREE.DirectionalLight(0x5b82ff, 0.9)
    rim.position.set(-5, -2, -4)
    scene.add(ambient, key, rim)

    const STACK_X = stackXOffset, STACK_Y = 0.3

    const scanGeo = new THREE.PlaneGeometry(3.6, 0.045)
    const scanMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 })
    const scan = new THREE.Mesh(scanGeo, scanMat)
    scan.position.set(STACK_X, STACK_Y + 1.3, 0.45)
    group.add(scan)

    // Checkmark: an explicit 3-point path centred on the assembled stack,
    // sized to stay well inside the panel bounds (half-width 1.3, half-height
    // 0.75) regardless of viewport, so it can never overflow like a
    // hand-placed box pair.
    const checkPts = [
      new THREE.Vector3(STACK_X - 0.52, STACK_Y - 0.02, 0.5),
      new THREE.Vector3(STACK_X - 0.14, STACK_Y - 0.4, 0.5),
      new THREE.Vector3(STACK_X + 0.56, STACK_Y + 0.38, 0.5),
    ]
    const checkCurve = new THREE.CatmullRomCurve3(checkPts)
    const checkGeo = new THREE.TubeGeometry(checkCurve, 24, 0.055, 8, false)
    const checkMat = new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0 })
    const checkMesh = new THREE.Mesh(checkGeo, checkMat)
    group.add(checkMesh)

    const glowGeo = new THREE.CircleGeometry(0.9, 32)
    const glowMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.set(STACK_X + 0.02, STACK_Y, 0.3)
    group.add(glow)

    const clock = new THREE.Clock()
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    let raf = 0
    let disposed = false

    function resize() {
      if (!host) return
      const w = host.clientWidth, h = host.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(h, 1)
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const ASSEMBLE_END = reduceMotion ? 0 : 2.1
    const SCAN_START = ASSEMBLE_END + 0.3
    const SCAN_END = SCAN_START + 1.0
    const GLOW_START = SCAN_END - 0.1
    const CHECK_START = SCAN_END + 0.1
    const CHECK_END = CHECK_START + 0.7

    function frame() {
      if (disposed) return
      const t = clock.getElapsedTime()
      const a = reduceMotion ? 1 : Math.min(t / ASSEMBLE_END, 1)
      const ea = ease(a)
      for (let i = 0; i < COUNT; i++) {
        panels[i].position.lerpVectors(start[i].pos, target[i].pos, ea)
        panels[i].rotation.set(
          THREE.MathUtils.lerp(start[i].rot.x, target[i].rot.x, ea),
          THREE.MathUtils.lerp(start[i].rot.y, target[i].rot.y, ea),
          THREE.MathUtils.lerp(start[i].rot.z, target[i].rot.z, ea),
        )
      }
      camera.position.lerpVectors(camStart, camEnd, ea)
      camera.lookAt(lookAt)

      if (t > SCAN_START) {
        const s = Math.min((t - SCAN_START) / (SCAN_END - SCAN_START), 1)
        scanMat.opacity = s < 1 ? 0.9 : 0
        scan.position.y = THREE.MathUtils.lerp(STACK_Y + 1.3, STACK_Y - 1.3, ease(s))
      }
      if (t > GLOW_START) {
        const g = Math.min((t - GLOW_START) / 0.9, 1)
        glowMat.opacity = Math.sin(g * Math.PI) * 0.55
      }
      if (t > CHECK_START) {
        const c = Math.min((t - CHECK_START) / (CHECK_END - CHECK_START), 1)
        checkMat.opacity = ease(c)
      }
      if (!reduceMotion) {
        group.rotation.y = Math.sin(t * 0.15) * 0.1
        group.rotation.x = Math.sin(t * 0.11) * 0.035
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      panels.forEach(p => (p.material as THREE.Material).dispose())
      panelGeo.dispose(); scanGeo.dispose(); scanMat.dispose(); checkMat.dispose(); checkGeo.dispose(); glowGeo.dispose(); glowMat.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} aria-hidden />
}
