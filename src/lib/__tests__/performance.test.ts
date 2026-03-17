import { describe, it, expect, beforeEach } from 'vitest'
import { cache, CACHE_TTL } from '../performance'

describe('Performance Module - Cache', () => {
  beforeEach(() => {
    cache.clear()
  })

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull()
  })

  it('should delete values correctly', () => {
    cache.set('key1', 'value1')
    expect(cache.delete('key1')).toBe(true)
    expect(cache.get('key1')).toBeNull()
  })

  it('should clear all values', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.clear()
    
    expect(cache.get('key1')).toBeNull()
    expect(cache.get('key2')).toBeNull()
  })

  it('should store complex objects', () => {
    const obj = { id: 1, name: 'test', data: [1, 2, 3] }
    cache.set('complex', obj)
    expect(cache.get('complex')).toEqual(obj)
  })
})

describe('Performance Module - CACHE_TTL', () => {
  it('should have correct TTL values', () => {
    expect(CACHE_TTL.tasks).toBe(30000)
    expect(CACHE_TTL.stats).toBe(60000)
    expect(CACHE_TTL.search).toBe(15000)
    expect(CACHE_TTL.default).toBe(10000)
  })

  it('should have all required keys', () => {
    expect(CACHE_TTL).toHaveProperty('tasks')
    expect(CACHE_TTL).toHaveProperty('stats')
    expect(CACHE_TTL).toHaveProperty('search')
    expect(CACHE_TTL).toHaveProperty('default')
  })
})
