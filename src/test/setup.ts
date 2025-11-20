// Configuración global para las pruebas
import { beforeEach, vi } from 'vitest'

// Credenciales dummy para que createClient no falle al importar módulos que usan Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

// Mock de window
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Limpiar localStorage antes de cada prueba
beforeEach(() => {
  localStorage.clear()
})

// Mock de console para evitar ruido en las pruebas
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
}

