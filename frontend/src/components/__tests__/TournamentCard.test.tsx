import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TournamentCard from '../TournamentCard'
import type { Tournament } from '../../api/tournaments'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const baseTournament: Tournament = {
  id: 'abc-123',
  name: 'Chess Masters',
  sport_type: 'Chess',
  bracket_type: 'single_elim',
  max_participants: 8,
  current_participants: 3,
  start_date: '2026-06-01T10:00:00Z',
  end_date: '2026-06-02T10:00:00Z',
  status: 'open',
  is_visible: true,
  is_team_based: false,
  organizer_id: 'org-1',
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-01T00:00:00Z',
}

beforeEach(() => {
  mockNavigate.mockClear()
})

function renderCard(tournament: Tournament = baseTournament) {
  return render(
    <MemoryRouter>
      <TournamentCard tournament={tournament} />
    </MemoryRouter>
  )
}

describe('TournamentCard', () => {
  it('renders tournament name', () => {
    renderCard()
    expect(screen.getByText('Chess Masters')).toBeInTheDocument()
  })

  it('renders sport type', () => {
    renderCard()
    expect(screen.getByText('Chess')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    renderCard()
    expect(screen.getByText('open')).toBeInTheDocument()
  })

  it('renders participant count', () => {
    renderCard()
    expect(screen.getByText('3/8 participants')).toBeInTheDocument()
  })

  it('renders bracket label for single_elim', () => {
    renderCard()
    expect(screen.getByText('Single Elim')).toBeInTheDocument()
  })

  it('renders bracket label for round_robin', () => {
    renderCard({ ...baseTournament, bracket_type: 'round_robin' })
    expect(screen.getByText('Round Robin')).toBeInTheDocument()
  })

  it('navigates to tournament detail on click', () => {
    renderCard()
    fireEvent.click(screen.getByText('Chess Masters').closest('div')!)
    expect(mockNavigate).toHaveBeenCalledWith('/tournaments/abc-123')
  })
})
