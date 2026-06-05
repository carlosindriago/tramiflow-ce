import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
const mockUpdateUser = vi.fn()

vi.mock('@tramiflow/database/server', () => ({
  createClient: vi.fn(() => ({
      auth: {
          updateUser: mockUpdateUser,
      }
  })),
}))

import { updateProfileName, updateUserPassword } from './actions'

describe('updateProfileName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update name successfully', async () => {
    // Arrange
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: '123', email: 'test@test.com' } },
      error: null
    })

    // Act
    const result = await updateProfileName('Juan Pérez')

    // Assert
    expect(result.success).toBe(true)
    expect(result.message).toBe('Nombre actualizado correctamente')
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { full_name: 'Juan Pérez' }
    })
  })

  it('should return error when update fails', async () => {
    // Arrange
    mockUpdateUser.mockResolvedValue({
      data: null,
      error: { message: 'Token expirado' }
    })

    // Act
    const result = await updateProfileName('Juan Pérez')

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe('No se pudo actualizar el nombre. Por favor, inicia sesión nuevamente.')
  })
})

describe('updateUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update password successfully', async () => {
    // Arrange
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null
    })

    // Act
    const result = await updateUserPassword('oldPassword123', 'NewPassword456', 'NewPassword456')

    // Assert
    expect(result.success).toBe(true)
    expect(result.message).toBe('Contraseña actualizada correctamente')
  })

  it('should return error when Supabase fails', async () => {
    // Arrange
    mockUpdateUser.mockResolvedValue({
      data: null,
      error: { message: 'Invalid password' }
    })

    // Act
    const result = await updateUserPassword('oldPassword123', 'NewPassword456', 'NewPassword456')

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe('No se pudo actualizar la contraseña. Por favor, verifica tu sesión.')
  })
})
