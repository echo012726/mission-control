// Data Encryption Utilities
// Uses Web Crypto API for AES-GCM encryption

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const TAG_LENGTH = 128

export interface EncryptedData {
  iv: string
  data: string
  salt?: string
}

// Generate a random encryption key
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

// Export key to base64 for storage
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  const bytes = new Uint8Array(exported)
  return btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(''))
}

// Import key from base64
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0))
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

// Encrypt data
export async function encryptData(plaintext: string, key: CryptoKey): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  
  const encodedData = new TextEncoder().encode(plaintext)
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    encodedData
  )
  
  return {
    iv: btoa(Array.from(iv).map(b => String.fromCharCode(b)).join('')),
    data: btoa(Array.from(new Uint8Array(encrypted)).map(b => String.fromCharCode(b)).join(''))
  }
}

// Decrypt data
export async function decryptData(encrypted: EncryptedData, key: CryptoKey): Promise<string> {
  const iv = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0))
  const data = Uint8Array.from(atob(encrypted.data), c => c.charCodeAt(0))
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    key,
    data
  )
  
  return new TextDecoder().decode(decrypted)
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  return btoa(Array.from(bytes).map(b => String.fromCharCode(b)).join(''))
}

// Check if string is base64 encrypted format
export function isEncryptedData(str: string): boolean {
  try {
    const parsed = JSON.parse(str)
    return !!(parsed.iv && parsed.data)
  } catch {
    return false
  }
}

// Simple salt generator for password-based encryption
export function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Check if encryption is enabled in localStorage
export function isEncryptionEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('encryption-enabled') === 'true'
}

// Derive key from password (simplified - use proper KDF in production)
export async function deriveKeyFromPassword(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

// Encrypt object fields recursively
export async function encryptObject(
  obj: Record<string, unknown>,
  key: CryptoKey,
  fieldsToEncrypt: string[]
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === 'string') {
      const encrypted = await encryptData(result[field] as string, key)
      result[field] = JSON.stringify(encrypted)
    }
  }
  
  return result
}

// Decrypt object fields
export async function decryptObject(
  obj: Record<string, unknown>,
  key: CryptoKey,
  fieldsToDecrypt: string[]
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        const parsed = JSON.parse(result[field] as string)
        if (parsed.iv && parsed.data) {
          result[field] = await decryptData(parsed, key)
        }
      } catch {
        // Not encrypted or invalid - leave as-is
      }
    }
  }
  
  return result
}
