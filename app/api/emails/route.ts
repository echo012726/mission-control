import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Email {
  id: string
  from: string
  subject: string
  date: number
  preview: string
}

function parseEmail(filePath: string): Email | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    
    const fromMatch = content.match(/^From:\s*(.+)$/m)
    const subjectMatch = content.match(/^Subject:\s*(.+)$/m)
    const dateMatch = content.match(/^Date:\s*(.+)$/m)
    
    // Get preview - first 100 chars after headers
    const bodyStart = content.indexOf('\n\n')
    let preview = ''
    if (bodyStart > 0) {
      preview = content.slice(bodyStart + 2).replace(/\n/g, ' ').slice(0, 100).trim()
    }
    
    let date = Date.now()
    if (dateMatch) {
      const parsed = new Date(dateMatch[1])
      if (!isNaN(parsed.getTime())) {
        date = parsed.getTime()
      }
    }
    
    return {
      id: path.basename(filePath),
      from: fromMatch ? fromMatch[1].replace(/<.*>/, '').trim() : 'Unknown',
      subject: subjectMatch ? subjectMatch[1] : '(No Subject)',
      date,
      preview
    }
  } catch (e) {
    return null
  }
}

export async function GET() {
  const inboxDir = '/root/Maildir/INBOX'
  
  try {
    // Read both new and cur folders
    const newDir = path.join(inboxDir, 'new')
    const curDir = path.join(inboxDir, 'cur')
    
    const dirs = [newDir, curDir].filter(d => fs.existsSync(d))
    
    let emails: Email[] = []
    
    for (const dir of dirs) {
      const files = fs.readdirSync(dir)
      for (const file of files.slice(0, 20)) { // Max 20 per folder
        const email = parseEmail(path.join(dir, file))
        if (email) emails.push(email)
      }
    }
    
    // Sort by date, newest first
    emails.sort((a, b) => b.date - a.date)
    
    // Take top 10
    emails = emails.slice(0, 10)
    
    return NextResponse.json(emails)
  } catch (error) {
    console.error('Error reading emails:', error)
    return NextResponse.json({ error: 'Failed to load emails' }, { status: 500 })
  }
}
