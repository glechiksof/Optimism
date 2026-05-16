import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CapacityBar from '../CapacityBar'

describe('CapacityBar', () => {
  it('renders current and max counts', () => {
    render(<CapacityBar current={3} max={10} />)
    expect(screen.getByText('3/10')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
  })

  it('calculates correct percentage width', () => {
    const { container } = render(<CapacityBar current={5} max={10} />)
    const fillBar = container.querySelector('[style*="width: 50%"]')
    expect(fillBar).not.toBeNull()
  })

  it('uses success color below 50%', () => {
    const { container } = render(<CapacityBar current={4} max={10} />)
    const fills = container.querySelectorAll('div')
    const fillBar = Array.from(fills).find(d => d.style.width && d.style.height === '100%')
    expect(fillBar?.style.background).toBe('var(--color-success)')
  })

  it('uses warning color between 50% and 80%', () => {
    const { container } = render(<CapacityBar current={6} max={10} />)
    const fills = container.querySelectorAll('div')
    const fillBar = Array.from(fills).find(d => d.style.width && d.style.height === '100%')
    expect(fillBar?.style.background).toBe('var(--color-warning)')
  })

  it('uses error color above 80%', () => {
    const { container } = render(<CapacityBar current={9} max={10} />)
    const fills = container.querySelectorAll('div')
    const fillBar = Array.from(fills).find(d => d.style.width && d.style.height === '100%')
    expect(fillBar?.style.background).toBe('var(--color-error)')
  })

  it('caps width at 100% when over capacity', () => {
    const { container } = render(<CapacityBar current={15} max={10} />)
    const fillBar = container.querySelector('[style*="width: 100%"]')
    expect(fillBar).not.toBeNull()
  })

  it('handles zero max without crashing', () => {
    const { container } = render(<CapacityBar current={0} max={0} />)
    const fills = container.querySelectorAll('div')
    const fillBar = Array.from(fills).find(d => d.style.width && d.style.height === '100%')
    expect(fillBar?.style.width).toBe('0%')
  })
})
