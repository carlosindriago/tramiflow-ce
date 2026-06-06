import { z } from 'zod'
import { Tables } from '@carlosindriago/database/types'

export type Client = Tables<'clients'>

// Type for individual identification document
export const identificationSchema = z.object({
    type: z.string().min(1, 'Tipo de documento requerido'),
    number: z.string().min(1, 'Número de documento requerido'),
})

export type Identification = z.infer<typeof identificationSchema>

export const createClientSchema = z.object({
    full_name: z.string().min(2, 'Nombre requerido (mínimo 2 caracteres)'),
    identifications: z.array(identificationSchema).min(0), // Required array, inferred from form
    nationality: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    notes: z.string().optional(),
    lead_id: z.string().optional(),
})

// Single Source of Truth - infer type directly from Zod schema
export type CreateClientInput = z.infer<typeof createClientSchema>

// Server Action result types
export type ClientActionError = {
  success?: false
  error: {
    _form?: string[]
    [key: string]: string[] | undefined
  }
}

export type ClientActionResult = ClientActionError | { success: true }

/**
 * Helper function to extract the primary identification number from a client's identifications.
 * The identifications field is stored as JSON in the database (could be string or parsed).
 * Returns the first identification number or null if none exists.
 */
/* eslint-disable */
export function getPrimaryIdentificationNumber(client: { identifications: any }): string | null {
  if (!client.identifications) return null
  
  try {
    // Handle both stringified and parsed JSON
    const identifications = typeof client.identifications === 'string' 
      ? JSON.parse(client.identifications) 
      : client.identifications
    
    // Return the first identification number if it exists
    if (Array.isArray(identifications) && identifications.length > 0) {
      return identifications[0]?.number || null
    }
    return null
  } catch (error) {
    console.error('Error parsing identifications:', error)
    return null
  }
}
