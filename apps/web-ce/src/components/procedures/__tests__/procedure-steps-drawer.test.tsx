import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProcedureStepsDrawer } from '../procedure-steps-drawer'
import type { Procedure } from '@carlosindriago/core'


const createMockProcedure = (overrides: Partial<Procedure> = {}): Procedure => ({
  id: 'test-procedure-id',
  organization_id: 'test-org-id',
  client_id: 'test-client-id',
  template_id: 'test-template-id',
  title: 'Habilitación Comercial',
  status: 'active-status-id',
  checklist_progress: {},
  current_step_index: 0,
  steps_progress: {},
  requirements_snapshot: [],
  payment_status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  client: { id: 'client-id', full_name: 'Juan Pérez', email: 'juan@test.com' },
  template: {
    id: 'template-id',
    name: 'Habilitación',
    requirements: [],
    steps: [
      { id: 'step1', title: 'Recopilar documentos', order: 0 },
      { id: 'step2', title: 'Presentar formulario', order: 1 },
    ],
    fees_professional: 100,
    fees_official: 50,
  },
  ...overrides,
})

describe('ProcedureStepsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when procedure is null', () => {
    const { container } = render(
      <ProcedureStepsDrawer procedure={null} open={true} onOpenChange={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders procedure title and client name', () => {
    render(
      <ProcedureStepsDrawer
        procedure={createMockProcedure()}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    expect(screen.getByText('Habilitación Comercial')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('renders all steps', () => {
    render(
      <ProcedureStepsDrawer
        procedure={createMockProcedure()}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Recopilar documentos/)).toBeInTheDocument()
    expect(screen.getByText(/Presentar formulario/)).toBeInTheDocument()
  })

  it('calls PATCH /api/procedures/[id] when checkbox toggled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    })
    global.fetch = fetchMock

    render(
      <ProcedureStepsDrawer
        procedure={createMockProcedure()}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    const stepButton = screen.getByText(/Recopilar documentos/).closest('button')!
    fireEvent.click(stepButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/procedures/test-procedure-id',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ steps_progress: { step1: true } }),
        })
      )
    })
  })

  it('reverts optimistic update when action fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, error: 'Server error' }),
    })
    global.fetch = fetchMock

    render(
      <ProcedureStepsDrawer
        procedure={createMockProcedure()}
        open={true}
        onOpenChange={vi.fn()}
      />
    )

    const stepButton = screen.getByText(/Recopilar documentos/).closest('button')!
    fireEvent.click(stepButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })
    // After revert, step should still appear as uncompleted (no line-through)
    expect(screen.getByText(/Recopilar documentos/)).not.toHaveClass('line-through')
  })

  it('calls onStepsUpdate with updated procedure when action succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    })
    global.fetch = fetchMock
    const onStepsUpdate = vi.fn()

    render(
      <ProcedureStepsDrawer
        procedure={createMockProcedure()}
        open={true}
        onOpenChange={vi.fn()}
        onStepsUpdate={onStepsUpdate}
      />
    )

    const stepButton = screen.getByText(/Recopilar documentos/).closest('button')!
    fireEvent.click(stepButton)

    await waitFor(() => {
      expect(onStepsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ steps_progress: { step1: true } })
      )
    })
  })

  it('renders link to full procedure page', () => {
    render(
      <ProcedureStepsDrawer
        procedure={createMockProcedure()}
        open={true}
        onOpenChange={vi.fn()}
      />
    )
    const link = screen.getByRole('link', { name: /ver expediente completo/i })
    expect(link).toHaveAttribute('href', '/procedures/test-procedure-id')
  })
})
