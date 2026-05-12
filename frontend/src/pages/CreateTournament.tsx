import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import FormError from '../components/ui/FormError'
import Toast from '../components/ui/Toast'
import { createTournament } from '../api/tournaments'

const BRACKET_OPTIONS = [
  { value: 'single_elim', label: 'Single Elimination' },
  { value: 'round_robin', label: 'Round Robin' },
]

interface FormErrors {
  name?: string
  sport_type?: string
  max_participants?: string
  start_date?: string
  end_date?: string
}

export default function CreateTournament() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [sportType, setSportType] = useState('')
  const [bracketType, setBracketType] = useState('single_elim')
  const [description, setDescription] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isVisible, setIsVisible] = useState(true)

  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function validate(): boolean {
    const e: FormErrors = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!sportType.trim()) e.sport_type = 'Sport type is required'
    const max = parseInt(maxParticipants)
    if (!maxParticipants || isNaN(max) || max < 2) e.max_participants = 'Must be at least 2'
    if (!startDate) e.start_date = 'Start date is required'
    if (!endDate) e.end_date = 'End date is required'
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      e.end_date = 'End date must be after start date'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit(status: 'draft' | 'open') {
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      await createTournament({
        name: name.trim(),
        sport_type: sportType.trim(),
        bracket_type: bracketType,
        description: description.trim() || undefined,
        max_participants: parseInt(maxParticipants),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_visible: status === 'draft' ? false : isVisible,
        status,
      })
      setToast({
        message: status === 'draft' ? 'Draft saved' : 'Tournament created',
        variant: 'success',
      })
      setTimeout(() => navigate('/tournaments?tab=hosted'), 1200)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to save tournament'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>Create Tournament</h1>

        <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Tournament Name *"
            placeholder="e.g. City Cup 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={loading}
          />

          <Input
            label="Sport Type *"
            placeholder="e.g. Football, Basketball"
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            error={errors.sport_type}
            disabled={loading}
          />

          <Select
            label="Bracket Type *"
            options={BRACKET_OPTIONS}
            value={bracketType}
            onChange={(e) => setBracketType(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Description"
            placeholder="Optional description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Max Participants *"
            type="number"
            min={2}
            placeholder="e.g. 16"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            error={errors.max_participants}
            disabled={loading}
          />

          <Input
            label="Start Date *"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.start_date}
            disabled={loading}
          />

          <Input
            label="End Date *"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={errors.end_date}
            disabled={loading}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              disabled={loading}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Visible to everyone (uncheck to make private)
          </label>

          <FormError message={apiError} />

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button
              type="button"
              variant="secondary"
              loading={loading}
              onClick={() => submit('draft')}
              style={{ flex: 1 }}
            >
              SAVE DRAFT
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={loading}
              onClick={() => submit('open')}
              style={{ flex: 1 }}
            >
              PUBLISH
            </Button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
