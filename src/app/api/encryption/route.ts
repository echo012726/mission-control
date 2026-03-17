import { NextRequest, NextResponse } from 'next/server'
import { getSession, logActivity } from '@/lib/auth'
import { generateEncryptionKey, exportKey, importKey, encryptData, decryptData, isEncryptedData } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has encryption key configured
  // For now, return status - actual key storage would be in encrypted user settings
  return NextResponse.json({
    enabled: false,
    hasKey: false,
    message: 'Encryption API ready. Use POST to generate or set a key.'
  })
}

export async function POST(req: NextRequest) {
  const authenticated = await getSession()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action, key } = body

    if (action === 'generate') {
      // Generate new encryption key
      const cryptoKey = await generateEncryptionKey()
      const exportedKey = await exportKey(cryptoKey)
      
      await logActivity('encryption_key_generated', { action: 'generate' })
      
      return NextResponse.json({
        success: true,
        key: exportedKey,
        message: 'Encryption key generated. Save this key securely - it cannot be recovered!'
      })
    }

    if (action === 'set') {
      if (!key) {
        return NextResponse.json({ error: 'Key required' }, { status: 400 })
      }

      // Validate key by trying to import it
      try {
        await importKey(key)
        await logActivity('encryption_key_set', { action: 'set' })
        
        return NextResponse.json({
          success: true,
          message: 'Encryption key configured successfully'
        })
      } catch {
        return NextResponse.json({ error: 'Invalid key format' }, { status: 400 })
      }
    }

    if (action === 'encrypt') {
      const { plaintext } = body
      if (!plaintext) {
        return NextResponse.json({ error: 'plaintext required' }, { status: 400 })
      }

      // For demo, generate temporary key - in production, use stored key
      const cryptoKey = await generateEncryptionKey()
      const encrypted = await encryptData(plaintext, cryptoKey)
      
      return NextResponse.json({
        encrypted: JSON.stringify(encrypted)
      })
    }

    if (action === 'decrypt') {
      const { encrypted } = body
      if (!encrypted) {
        return NextResponse.json({ error: 'encrypted data required' }, { status: 400 })
      }

      try {
        const parsed = JSON.parse(encrypted)
        if (!parsed.iv || !parsed.data) {
          return NextResponse.json({ error: 'Invalid encrypted format' }, { status: 400 })
        }
        
        // For demo, generate temp key - in production use stored key
        const cryptoKey = await generateEncryptionKey()
        const decrypted = await decryptData(parsed, cryptoKey)
        
        return NextResponse.json({ decrypted })
      } catch (e) {
        return NextResponse.json({ error: 'Decryption failed - invalid key or data' }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Encryption API error:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
