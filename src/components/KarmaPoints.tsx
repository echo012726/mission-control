'use client'
import { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Flame, Award } from 'lucide-react'

export default function KarmaPoints({ points = 0, level = 1, streak = 0 }: { points?: number, level?: number, streak?: number }) {
  const [currentPoints, setCurrentPoints] = useState(points)
  const nextLevel = level * 1000
  const progress = Math.min(100, (currentPoints / nextLevel) * 100)

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Trophy className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Karma Level {level}</h3>
            <p className="text-sm text-indigo-100">{currentPoints.toLocaleString()} / {nextLevel.toLocaleString()} pts</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-orange-300 font-bold">
            <Flame className="w-5 h-5 fill-current" />
            <span>{streak} Day Streak</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-indigo-100">
          <span>Level {level}</span>
          <span>Level {level + 1}</span>
        </div>
        <div className="h-3 bg-black/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-1000 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="bg-black/10 rounded-lg p-3 text-center backdrop-blur-sm">
          <Star className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
          <p className="text-xs text-indigo-100">Tasks Done</p>
          <p className="font-bold">42</p>
        </div>
        <div className="bg-black/10 rounded-lg p-3 text-center backdrop-blur-sm">
          <Zap className="w-5 h-5 text-blue-300 mx-auto mb-1" />
          <p className="text-xs text-indigo-100">Early Finish</p>
          <p className="font-bold">12</p>
        </div>
        <div className="bg-black/10 rounded-lg p-3 text-center backdrop-blur-sm">
          <Award className="w-5 h-5 text-pink-300 mx-auto mb-1" />
          <p className="text-xs text-indigo-100">Top Skills</p>
          <p className="font-bold">3</p>
        </div>
      </div>
    </div>
  )
}
