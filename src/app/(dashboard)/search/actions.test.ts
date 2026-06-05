import { describe, it, expect } from 'vitest'

// Test validation only (the Supabase query part is hard to mock properly)
import { searchGlobal } from './actions'

describe('searchGlobal validation', () => {
  it('should return error for empty query', async () => {
    const result = await searchGlobal('')
    expect(result.success).toBe(false)
    expect(result.error).toBe('El término de búsqueda debe tener al menos 2 caracteres')
  })

  it('should return error for whitespace-only query', async () => {
    const result = await searchGlobal('   ')
    expect(result.success).toBe(false)
  })

  it('should return error for query shorter than 2 chars', async () => {
    const result = await searchGlobal('a')
    expect(result.success).toBe(false)
  })
})
