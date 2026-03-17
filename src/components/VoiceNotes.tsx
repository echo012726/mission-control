'use client'
import { useState, useRef } from 'react'
import { Mic, Square, Play, Pause, Trash2, Activity } from 'lucide-react'

type Recording = {
  id: string
  url: string
  duration: number
  createdAt: Date
}

export default function VoiceNotes({ taskId }: { taskId?: string }) {
  const [recording, setRecording] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [playing, setPlaying] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      chunks.current = []
      
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }
      
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordings([...recordings, { id: Date.now().toString(), url, duration: 30, createdAt: new Date() }])
        stream.getTracks().forEach(t => t.stop())
      }
      
      mediaRecorder.current.start()
      setRecording(true)
    } catch (e) {
      console.error('Mic access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const togglePlay = (id: string, url: string) => {
    const audio = new Audio(url)
    if (playing === id) {
      audio.pause()
      setPlaying(null)
    } else {
      audio.play()
      setPlaying(id)
    }
  }

  const deleteRecording = (id: string) => {
    setRecordings(recordings.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            recording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white'
          }`}
        >
          {recording ? <><Square className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Record</>}
        </button>
        {recording && <span className="text-red-500 flex items-center gap-1"><Activity className="w-4 h-4 animate-pulse"/> Recording...</span>}
      </div>

      {recordings.length > 0 && (
        <div className="space-y-2">
          {recordings.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <button onClick={() => togglePlay(r.id, r.url)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                {playing === r.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse" style={{ width: playing === r.id ? '100%' : '30%' }} />
              </div>
              <span className="text-xs text-gray-500">{r.duration}s</span>
              <button onClick={() => deleteRecording(r.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
