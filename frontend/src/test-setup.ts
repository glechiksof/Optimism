import '@testing-library/jest-dom'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Node 26 exposes an experimental (undefined) localStorage that shadows jsdom's.
// Provide a real in-memory stub so Zustand persist and any direct storage calls work.
if (typeof localStorage === 'undefined' || localStorage == null) {
  const _store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => _store[k] ?? null,
    setItem: (k: string, v: string) => { _store[k] = String(v) },
    removeItem: (k: string) => { delete _store[k] },
    clear: () => { for (const k in _store) delete _store[k] },
    get length() { return Object.keys(_store).length },
    key: (i: number) => Object.keys(_store)[i] ?? null,
  })
}

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  localStorage.clear()
})
