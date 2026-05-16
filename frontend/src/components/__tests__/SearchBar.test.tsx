import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from '../SearchBar'

describe('SearchBar', () => {
  it('renders input with current value', () => {
    render(<SearchBar value="chess" onChange={vi.fn()} />)
    expect(screen.getByDisplayValue('chess')).toBeInTheDocument()
  })

  it('renders placeholder when provided', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Find a team..." />)
    expect(screen.getByPlaceholderText('Find a team...')).toBeInTheDocument()
  })

  it('renders default placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'foo' } })
    expect(onChange).toHaveBeenCalledWith('foo')
  })

  it('shows clear button when value is non-empty', () => {
    render(<SearchBar value="something" onChange={vi.fn()} />)
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
  })

  it('does not show clear button when value is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.queryByLabelText('Clear search')).toBeNull()
  })

  it('calls onChange with empty string when clear button clicked', () => {
    const onChange = vi.fn()
    render(<SearchBar value="hello" onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Clear search'))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
