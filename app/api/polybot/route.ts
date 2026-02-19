import { NextResponse } from 'next/server'
import fs from 'fs'

export async function GET() {
  try {
    const log = fs.readFileSync('/var/log/polybot.log', 'utf-8')
    const lines = log.split('\n').filter(l => l.trim())
    
    // Parse last status block
    let bankroll = 0
    let totalPnL = 0
    let dailyPnL = 0
    let openPositions = 0
    let dailyTrades = 0
    let mode = 'PAPER'
    let lastScan = Date.now()
    
    for (const line of lines.reverse()) {
      if (line.includes('Bankroll:')) {
        const match = line.match(/\$([\d.]+)/)
        if (match) bankroll = parseFloat(match[1])
      }
      if (line.includes('Total P&L:')) {
        const match = line.match(/\$?(-?[\d.]+)/)
        if (match) totalPnL = parseFloat(match[1])
      }
      if (line.includes('Daily P&L:')) {
        const match = line.match(/\$?(-?[\d.]+)/)
        if (match) dailyPnL = parseFloat(match[1])
      }
      if (line.includes('Open Positions:')) {
        const match = line.match(/(\d+)/)
        if (match) openPositions = parseInt(match[1])
      }
      if (line.includes('Daily Trades:')) {
        const match = line.match(/(\d+)/)
        if (match) dailyTrades = parseInt(match[1])
      }
      if (line.includes('Mode:')) {
        mode = line.includes('PAPER') ? 'PAPER' : 'LIVE'
      }
    }
    
    return NextResponse.json({
      bankroll,
      totalPnL,
      dailyPnL,
      openPositions,
      dailyTrades,
      mode,
      lastScan
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Could not read bot stats',
      bankroll: 60,
      totalPnL: -40,
      dailyPnL: 0,
      openPositions: 0,
      dailyTrades: 4,
      mode: 'PAPER',
      lastScan: Date.now()
    })
  }
}
