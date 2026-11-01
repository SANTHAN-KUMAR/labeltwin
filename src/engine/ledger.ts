// Tamper-evident audit ledger: SHA-256 hash chain (WebCrypto) + ECDSA P-256 e-signatures (21 CFR Part 11 §11.50/§11.70 manifestation).

export interface LedgerEvent {
  seq: number
  ts: string
  actor: string
  role: string
  action: string
  object: string
  detail: string
  meaning?: string       // e-signature meaning (Review / Approval / Responsibility)
  signature?: string     // base64 ECDSA signature over the record hash
  prevHash: string
  hash: string
}

const enc = new TextEncoder()
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)))

export async function sha256(s: string) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))) }

function canonical(e: Omit<LedgerEvent, 'hash' | 'signature'>) {
  return JSON.stringify([e.seq, e.ts, e.actor, e.role, e.action, e.object, e.detail, e.meaning ?? '', e.prevHash])
}

let keyPair: CryptoKeyPair | null = null
export async function signingKey() {
  if (!keyPair) keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  return keyPair
}
export async function publicKeyJwk() { return crypto.subtle.exportKey('jwk', (await signingKey()).publicKey) }

export async function appendEvent(chain: LedgerEvent[], e: { actor: string; role: string; action: string; object: string; detail: string; meaning?: string; ts?: string }): Promise<LedgerEvent[]> {
  const prevHash = chain.length ? chain[chain.length - 1].hash : '0'.repeat(64)
  const base = { seq: chain.length + 1, ts: e.ts ?? new Date().toISOString(), actor: e.actor, role: e.role, action: e.action, object: e.object, detail: e.detail, meaning: e.meaning, prevHash }
  const hash = await sha256(canonical(base))
  let signature: string | undefined
  if (e.meaning) {
    const kp = await signingKey()
    signature = b64(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, enc.encode(hash)))
  }
  return [...chain, { ...base, hash, signature }]
}

export interface ChainCheck { ok: boolean; brokenAt?: number; checked: number; sigOk: number; sigFail: number }

export async function verifyChain(chain: LedgerEvent[]): Promise<ChainCheck> {
  let prev = '0'.repeat(64), sigOk = 0, sigFail = 0
  const kp = await signingKey()
  for (const e of chain) {
    const h = await sha256(canonical({ ...e, prevHash: prev }))
    if (e.prevHash !== prev || h !== e.hash) return { ok: false, brokenAt: e.seq, checked: e.seq, sigOk, sigFail }
    if (e.signature) {
      const sig = Uint8Array.from(atob(e.signature), c => c.charCodeAt(0))
      ;(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, kp.publicKey, sig, enc.encode(e.hash))) ? sigOk++ : sigFail++
    }
    prev = e.hash
  }
  return { ok: sigFail === 0, checked: chain.length, sigOk, sigFail }
}

/** Deterministic LBOM hash: the label revision identity. */
export async function lbomHash(lbom: unknown) { return sha256(JSON.stringify(lbom)) }
