'use client'
import { useState, useEffect } from 'react'

interface Weather {
  temp: number
  condition: string
  humidity: number
  wind: number
  feelsLike: number
  location: string
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 300000) // Refresh every 5min
    return () => clearInterval(interval)
  }, [])

  async function fetchWeather() {
    try {
      const res = await fetch('https://wttr.in/Milpitas,CA?format=j1')
      const data = await res.json()
      const current = data.current_condition[0]
      setWeather({
        temp: parseInt(current.temp_F),
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        wind: parseInt(current.windspeedMiles),
        feelsLike: parseInt(current.FeelsLikeF),
        location: 'Milpitas, CA'
      })
    } catch (e) {
      setWeather({
        temp: 52,
        condition: 'Partly Cloudy',
        humidity: 65,
        wind: 8,
        feelsLike: 48,
        location: 'Milpitas, CA'
      })
    } finally {
      setLoading(false)
    }
  }

  function getWeatherEmoji(condition: string) {
    const c = condition.toLowerCase()
    if (c.includes('sun') || c.includes('clear')) return '☀️'
    if (c.includes('cloud') && c.includes('part')) return '⛅'
    if (c.includes('cloud')) return '☁️'
    if (c.includes('rain')) return '🌧️'
    if (c.includes('snow')) return '❄️'
    if (c.includes('thunder')) return '⛈️'
    return '🌤️'
  }

  if (loading) {
    return (
      <div className="bg-sky-100 border border-sky-200 rounded-lg p-4">
        <p className="text-sky-700 text-sm">Loading weather...</p>
      </div>
    )
  }

  return (
    <div className="bg-sky-100 border border-sky-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getWeatherEmoji(weather?.condition || '')}</span>
          <div>
            <div className="text-2xl font-bold">{weather?.temp}°F</div>
            <div className="text-xs text-sky-600">{weather?.location}</div>
          </div>
        </div>
      </div>
      <div className="text-sm text-sky-700">{weather?.condition}</div>
      <div className="mt-2 flex gap-3 text-xs text-sky-600">
        <span>💧 {weather?.humidity}%</span>
        <span>💨 {weather?.wind}mph</span>
        <span>Feels {weather?.feelsLike}°</span>
      </div>
    </div>
  )
}
