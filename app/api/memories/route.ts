import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  const memoryDir = '/root/.openclaw/workspace/memory'
  
  try {
    const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'))
    
    const memories = files.map(filename => {
      const filePath = path.join(memoryDir, filename)
      const content = fs.readFileSync(filePath, 'utf-8')
      const stats = fs.statSync(filePath)
      
      // Extract title from first # heading or use filename
      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch ? titleMatch[1] : filename.replace('.md', '')
      
      // Get first 500 chars as preview
      const preview = content.slice(0, 500).replace(/[#*`]/g, '').trim()
      
      return {
        id: filename,
        title,
        content: content.slice(0, 5000), // Limit content size
        preview,
        source: `memory/${filename}`,
        createdAt: stats.birthtime.getTime(),
        updatedAt: stats.mtime.getTime()
      }
    })
    
    // Sort by updated time, newest first
    memories.sort((a, b) => b.updatedAt - a.updatedAt)
    
    return NextResponse.json(memories)
  } catch (error) {
    console.error('Error reading memories:', error)
    return NextResponse.json({ error: 'Failed to load memories' }, { status: 500 })
  }
}
