'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Cloudy, MapPin, RefreshCw, Thermometer } from 'lucide-react'

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  wind: number
  location: string
  icon: string
}

interface WeatherWidgetProps {
  location?: string
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'sunny': <Sun size={32} className="text-yellow-400" />,
  'partly-cloudy': <Cloudy size={32} className="text-gray-400" />,
  'cloudy': <Cloud size={32} className="text-gray-500" />,
  'rain': <CloudRain size={32} className="text-blue-400" />,
  'snow': <CloudSnow size={32} className="text-blue-200" />,
  'thunder': <CloudLightning size={32} className="text-yellow-500" />,
}

function getWeatherIcon(condition: string): React.ReactNode {
  const c = condition.toLowerCase()
  if (c.includes('sun') || c.includes('clear')) return ICON_MAP.sunny
  if (c.includes('partly')) return ICON_MAP['partly-cloudy']
  if (c.includes('rain') || c.includes('drizzle')) return ICON_MAP.rain
  if (c.includes('snow')) return ICON_MAP.snow
  if (c.includes('thunder') || c.includes('storm')) return ICON_MAP.thunder
  if (c.includes('cloud')) return ICON_MAP.cloudy
  return ICON_MAP['partly-cloudy']
}

function parseWeatherFromText(text: string): WeatherData | null {
  try {
    // Parse wttr.in text output
    const lines = text.split('\n')
    let location = 'Unknown'
    let temp = 0
    let condition = 'Unknown'
    let humidity = 0
    let wind = 0

    for (const line of lines) {
      if (line.includes('Weather:')) {
        condition = line.split('Weather:')[1]?.trim() || 'Unknown'
      }
      if (line.includes('Temperature:')) {
        const match = line.match(/([+-]?\d+)/)
        if (match) temp = parseInt(match[1])
      }
      if (line.includes('Humidity:')) {
        const match = line.match(/(\d+)%/)
        if (match) humidity = parseInt(match[1])
      }
      if (line.includes('Wind:')) {
        const match = line.match(/(\d+)/)
        if (match) wind = parseInt(match[1])
      }
    }

    // Try JSON format first
    const jsonMatch = text.match(/\{[\s\S]*"temp_C":\s*([+-]?\d+)[\s\S]*"weather":\s*"([^"]+)"[\s\S]*"humidity":\s*(\d+)[\s\S]*"wind":\s*(\d+)[\s\S]*\}/)
    if (jsonMatch) {
      return {
        temp: parseInt(jsonMatch[1]),
        condition: jsonMatch[2],
        humidity: parseInt(jsonMatch[3]),
        wind: parseInt(jsonMatch[4]),
        location: 'Current',
        icon: jsonMatch[2].toLowerCase()
      }
    }

    return { temp, condition, humidity, wind, location: 'Current', icon: condition.toLowerCase() }
  } catch {
    return null
  }
}

export default function WeatherWidget({ location = 'auto' }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState(location)

  const fetchWeather = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use wttr.in - no API key needed
      const loc = userLocation === 'auto' ? '' : userLocation
      const res = await fetch(`https://wttr.in/${loc}?format=j1`, {
        signal: AbortSignal.timeout(10000)
      })
      
      if (!res.ok) throw new Error('Failed to fetch weather')
      
      const data = await res.json()
      const current = data.current_condition[0]
      
      setWeather({
        temp: parseInt(current.temp_C),
        condition: current.weatherDesc[0]?.value || 'Unknown',
        humidity: parseInt(current.humidity),
        wind: parseInt(current.windspeedKM),
        location: data.nearest_area?.[0]?.areaName?.[0]?.value || 'Current',
        icon: current.weatherCode?.toString() || '0'
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load weather')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeather()
  }, [])

  const handleLocationChange = (e: React.FormEvent) => {
    e.preventDefault()
    fetchWeather()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <RefreshCw size={24} className="text-gray-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm mb-2">{error}</p>
        <button
          onClick={fetchWeather}
          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mx-auto"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  if (!weather) return null

  return (
    <div>
      {/* Location Input */}
      <form onSubmit={handleLocationChange} className="mb-3 flex gap-1">
        <input
          type="text"
          value={userLocation}
          onChange={(e) => setUserLocation(e.target.value)}
          placeholder="City or location..."
          className="flex-1 bg-slate-100 border-0 rounded px-2 py-1 text-sm text-slate-700 placeholder-slate-400"
        />
        <button
          type="submit"
          className="text-slate-500 hover:text-slate-700"
        >
          <MapPin size={14} />
        </button>
      </form>

      {/* Weather Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.condition)}
          <div>
            <div className="text-2xl font-bold text-slate-700">
              {weather.temp}°C
            </div>
            <div className="text-xs text-slate-500">{weather.location}</div>
          </div>
        </div>
        
        <div className="text-right text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Cloud size={12} />
            {weather.humidity}%
          </div>
          <div className="flex items-center gap-1">
            <Thermometer size={12} />
            {weather.wind} km/h
          </div>
        </div>
      </div>

      <div className="mt-2 text-sm text-slate-600 text-center">
        {weather.condition}
      </div>
    </div>
  )
}
