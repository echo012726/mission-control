import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] || null,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock navigator.geolocation
const geolocationMock = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}
Object.defineProperty(navigator, 'geolocation', { value: geolocationMock })

// MockNotification
Object.defineProperty(window, 'Notification', {
  value: vi.fn().mockImplementation(() => ({
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  })),
})

// Mock BroadcastChannel
global.BroadcastChannel = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  onmessage: null,
  close: vi.fn(),
}))
