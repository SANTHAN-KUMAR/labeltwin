import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Hero narrative: loose label panels (Connect) assemble into an aligned stack
 * (Compile), a scan plane sweeps the stack (Verify), then an accent check
 * mark resolves in front of it (Prove). Plays once, then idles with a slow
 * drift. Colours are restricted to the app's own ink / accent / white tokens.
 */
export default function Scene3D() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50)
    camera.position.set(0, 0.4, 7.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const INK = 0x14161a, ACCENT = 0x3457d9, WHITE = 0xf3f5fa
    const COUNT = 7
    const panelGeo = new THREE.BoxGeometry(2.6, 1.5, 0.05)
    const panels: THREE.Mesh[] = []
    const start: { pos: THREE.Vector3; rot: THREE.Euler }[] = []
    const target: { pos: THREE.Vector3; rot: THREE.Euler }[] = []

    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? ACCENT : i % 3 === 1 ? WHITE : INK,
        roughness: 0.55, metalness: 0.08, transparent: true, opacity: 0.96,
      })
      const mesh = new THREE.Mesh(panelGeo, mat)
      const rand = (n: number) => (Math.random() - 0.5) * n
      start.push({ pos: new THREE.Vector3(rand(9), rand(5), rand(4) - 1), rot: new THREE.Euler(rand(2.4), rand(2.4), rand(2.4)) })
      const z = (i - (COUNT - 1) / 2) * 0.09
      target.push({ pos: new THREE.Vector3(0, 0, z), rot: new THREE.Euler(0, 0, 0) })
      mesh.position.copy(start[i].pos)
      mesh.rotation.copy(start[i].rot)
      group.add(mesh)
      panels.push(mesh)
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.75)
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(3, 4, 5)
    const rim = new THREE.DirectionalLight(0x3457d9, 0.5)
    rim.position.set(-4, -2, -3)
    scene.add(ambient, key, rim)

    const scanGeo = new THREE.PlaneGeometry(3.4, 0.05)
    const scanMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 })
    const scan = new THREE.Mesh(scanGeo, scanMat)
    scan.position.set(0, 1.2, 0.5)
    group.add(scan)

    const checkGroup = new THREE.Group()
    const checkMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 })
    const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.04), checkMat)
    const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.09, 0.04), checkMat)
    bar1.position.set(-0.52, -0.08, 0.5); bar1.rotation.z = Math.PI / 4
    bar2.position.set(0.1, 0.18, 0.5); bar2.rotation.z = -Math.PI / 4
    checkGroup.add(bar1, bar2)
    group.add(checkGroup)

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

    const ASSEMBLE_END = reduceMotion ? 0 : 1.6
    const SCAN_START = ASSEMBLE_END + 0.25
    const SCAN_END = SCAN_START + 0.9
    const CHECK_START = SCAN_END + 0.15
    const CHECK_END = CHECK_START + 0.6

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
      if (t > SCAN_START) {
        const s = Math.min((t - SCAN_START) / (SCAN_END - SCAN_START), 1)
        scanMat.opacity = s < 1 ? 0.85 : 0
        scan.position.y = THREE.MathUtils.lerp(1.2, -1.2, ease(s))
      }
      if (t > CHECK_START) {
        const c = Math.min((t - CHECK_START) / (CHECK_END - CHECK_START), 1)
        checkMat.opacity = ease(c)
      }
      if (!reduceMotion) {
        group.rotation.y = Math.sin(t * 0.18) * 0.12
        group.rotation.x = Math.sin(t * 0.13) * 0.04
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
      panelGeo.dispose(); scanGeo.dispose(); scanMat.dispose(); checkMat.dispose()
      bar1.geometry.dispose(); bar2.geometry.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} aria-hidden />
}
