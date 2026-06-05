// @ts-nocheck
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProcedureCard } from '../procedure-card'
import type { Procedure, TemplateStep } from '@tramiflow/core'
import type { ProcedureStatus } from '@tramiflow/core'

// Factory pattern for creating test procedures
const createMockProcedure = (overrides: Partial<Procedure> = {}): Procedure => ({
  id: 'test-procedure-id',
  organization_id: 'test-org-id',
  client_id: 'test-client-id',
  template_id: 'test-template-id',
  title: 'Test Procedure',
  status: 'active-status-id',
  checklist_progress: {},
  current_step_index: 0,
  steps_progress: {},
  requirements_snapshot: [],
  payment_status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  client: {
    id: 'test-client-id',
    full_name: 'Test Client',
    email: 'test@example.com',
  },
  template: {
    id: 'test-template-id',
    name: 'Test Template',
    requirements: [],
    steps: [],
    fees_professional: 100,
    fees_official: 50,
  },
  ...overrides,
})

const mockStatuses: ProcedureStatus[] = [
  {
    id: 'pending-status-id',
    organization_id: 'test-org-id',
    name: 'Pendiente',
    color: '#f59e0b',
    order_index: 0,
    is_final: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'active-status-id',
    organization_id: 'test-org-id',
    name: 'En Proceso',
    color: '#3b82f6',
    order_index: 1,
    is_final: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
describe('ProcedureCard', () => {
  describe('Rendering checklist', () => {
    it('renders checklist when template.steps has items', () => {
      const mockSteps: TemplateStep[] = [
        { id: 'step1', title: 'Step 1', order: 0 },
        { id: 'step2', title: 'Step 2', order: 1 },
      ]
      const procedure = createMockProcedure({
        template: {
          id: 'test-template-id',
          name: 'Test Template',
          requirements: [],
          steps: mockSteps,
          fees_professional: 100,
          fees_official: 50,
        },
      })

      render(<ProcedureCard procedure={procedure} statuses={mockStatuses} />)

      expect(screen.getByText('Step 1')).toBeInTheDocument()
      expect(screen.getByText('Step 2')).toBeInTheDocument()
    })

    it('does NOT render checklist when template.steps is empty', () => {
      const procedure = createMockProcedure()

      render(<ProcedureCard procedure={procedure} statuses={mockStatuses} />)

      expect(screen.queryByText('Step 1')).not.toBeInTheDocument()
    })

    it('does NOT render checklist when template.steps is absent (template is null)', () => {
      const procedure = createMockProcedure({
/* eslint-disable */
        template: null as any,
      })

      render(<ProcedureCard procedure={procedure} statuses={mockStatuses} />)

      expect(screen.queryByText('Step 1')).not.toBeInTheDocument()
    })

    it('shows all steps without truncation', () => {
      const manySteps: TemplateStep[] = Array.from({ length: 10 }, (_, i) => ({
        id: `step${i}`,
        title: `Step ${i}`,
        order: i,
      }))
      const procedure = createMockProcedure({
        template: {
          id: 'test-template-id',
          name: 'Test Template',
          requirements: [],
          steps: manySteps,
          fees_professional: 100,
          fees_official: 50,
        },
      })

      render(<ProcedureCard procedure={procedure} statuses={mockStatuses} />)

      for (let i = 0; i < 10; i++) {
        expect(screen.getByText(`Step ${i}`)).toBeInTheDocument()
      }
    })

    it('shows completed steps with checkmark', () => {
      const mockSteps: TemplateStep[] = [
        { id: 'step1', title: 'Step 1', order: 0 },
        { id: 'step2', title: 'Step 2', order: 1 },
      ]
      const procedure = createMockProcedure({
        template: {
          id: 'test-template-id',
          name: 'Test Template',
          requirements: [],
          steps: mockSteps,
          fees_professional: 100,
          fees_official: 50,
        },
        steps_progress: { step1: true },
      })

      render(<ProcedureCard procedure={procedure} statuses={mockStatuses} />)

      // Checkmark indicator for completed step
      const completedStep = screen.getByText('Step 1')
      expect(completedStep).toBeInTheDocument()
    })

    it('shows uncompleted steps without checkmark', () => {
      const mockSteps: TemplateStep[] = [
        { id: 'step1', title: 'Step 1', order: 0 },
      ]
      const procedure = createMockProcedure({
        template: {
          id: 'test-template-id',
          name: 'Test Template',
          requirements: [],
          steps: mockSteps,
          fees_professional: 100,
          fees_official: 50,
        },
        steps_progress: {},
      })

      render(<ProcedureCard procedure={procedure} statuses={mockStatuses} />)

      const step = screen.getByText('Step 1')
      expect(step).toBeInTheDocument()
    })
  })

  describe('Button "Ver detalles"', () => {
    it('calls onOpenDrawer with procedure id when clicked', () => {
      const mockSteps: TemplateStep[] = [{ id: 'step1', title: 'Step 1', order: 0 }]
      const procedure = createMockProcedure({
        template: {
          id: 'test-template-id',
          name: 'Test Template',
          requirements: [],
          steps: mockSteps,
          fees_professional: 100,
          fees_official: 50,
        },
      })
      const onOpenDrawer = vi.fn()

      render(<ProcedureCard procedure={procedure} onOpenDrawer={onOpenDrawer} />)

      const button = screen.getByText(/ver detalles/i)
      fireEvent.click(button)

      expect(onOpenDrawer).toHaveBeenCalledWith('test-procedure-id')
    })
  })

  describe('onPointerDown', () => {
    it('stops propagation to prevent drag in kanban', () => {
      const mockSteps: TemplateStep[] = [{ id: 'step1', title: 'Step 1', order: 0 }]
      const procedure = createMockProcedure({
        template: {
          id: 'test-template-id',
          name: 'Test Template',
          requirements: [],
          steps: mockSteps,
          fees_professional: 100,
          fees_official: 50,
        },
      })
      const onOpenDrawer = vi.fn()

      const { container } = render(
        <ProcedureCard procedure={procedure} onOpenDrawer={onOpenDrawer} />
      )

      const button = container.querySelector('button')!
      const pointerDownEvent = new PointerEvent('pointerdown', { bubbles: true })
      const stopPropagationSpy = vi.spyOn(pointerDownEvent, 'stopPropagation')

      fireEvent(button, pointerDownEvent)

      expect(stopPropagationSpy).toHaveBeenCalled()
    })
  })

  describe('Status display', () => {
    it('renders status badge with correct color', () => {
      const procedure = createMockProcedure()

      const { container } = render(<ProcedureCard procedure={procedure} statuses={mockStatuses} />)

      // The border left color is applied to the Card component (a child of Link or root)
      const cardRoot = container.querySelector('.border-l-\\[3px\\]') as HTMLElement
      expect(cardRoot.style.borderLeftColor).toBe('rgb(59, 130, 246)') // #3b82f6
    })

    it('formats created date correctly', () => {
      const procedure = createMockProcedure({
        created_at: '2024-01-15T10:30:00Z',
      })

      render(<ProcedureCard procedure={procedure} />)

      expect(screen.getByText('15 ene')).toBeInTheDocument()
    })
  })

  describe('Progress display', () => {
    it('shows progress when requirements exist', () => {
      const procedure = createMockProcedure({
        requirements_snapshot: [{ id: 'req1' }, { id: 'req2' }],
        checklist_progress: { req1: true },
      })

      render(<ProcedureCard procedure={procedure} />)

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('shows 0% progress when no requirements', () => {
      const procedure = createMockProcedure({
        requirements_snapshot: [],
      })

      render(<ProcedureCard procedure={procedure} />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Client info display', () => {
    it('renders client name when available', () => {
      const procedure = createMockProcedure({
        client: {
          id: 'client-id',
          full_name: 'John Doe',
          email: 'john@example.com',
        },
      })

      render(<ProcedureCard procedure={procedure} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('hides client info when hideClient is true', () => {
      const procedure = createMockProcedure({
        client: {
          id: 'client-id',
          full_name: 'John Doe',
          email: 'john@example.com',
        },
      })

      render(<ProcedureCard procedure={procedure} hideClient={true} />)

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('shows "Sin cliente" when no client data', () => {
      const procedure = createMockProcedure({
        client: undefined,
      })

      render(<ProcedureCard procedure={procedure} />)

      expect(screen.getByText('Sin cliente')).toBeInTheDocument()
    })
  })

  describe('Card click behavior', () => {
    it('renders as Link when no onClick handler', () => {
      const procedure = createMockProcedure()

      const { container } = render(<ProcedureCard procedure={procedure} />)

      const link = container.querySelector('a[href="/procedures/test-procedure-id"]')
      expect(link).toBeInTheDocument()
    })

    it('renders as clickable Card when onClick provided', () => {
      const procedure = createMockProcedure()
      const onClick = vi.fn()

      const { container } = render(<ProcedureCard procedure={procedure} onClick={onClick} />)

      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('cursor-pointer')
    })
  })

  describe('Status change dropdown', () => {
    it('shows dropdown when onStatusChange provided', () => {
      const procedure = createMockProcedure()
      const onStatusChange = vi.fn()

      render(<ProcedureCard procedure={procedure} onStatusChange={onStatusChange} statuses={mockStatuses} />)

      // Dropdown trigger (three dots/MoreVertical)
      const dropdownTrigger = document.querySelector('[data-state]')
      expect(dropdownTrigger).toBeInTheDocument()
    })

    it('calls onStatusChange when status item clicked', async () => {
      const procedure = createMockProcedure()
      const onStatusChange = vi.fn()

      render(<ProcedureCard procedure={procedure} onStatusChange={onStatusChange} statuses={mockStatuses} />)

      // Click on dropdown trigger using pointerDown for Radix UI
      const trigger = document.querySelector('[data-state]') as Element
      fireEvent.pointerDown(
        trigger,
        new PointerEvent('pointerdown', { bubbles: true, ctrlKey: false, button: 0 })
      )

      // Wait for the menu to open and click the option
      const statusOption = await screen.findByText('Pendiente')
      fireEvent.click(statusOption)

      expect(onStatusChange).toHaveBeenCalledWith('pending-status-id')
    })
  })
})
