import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import FormError from '../components/ui/FormError'
import Toast from '../components/ui/Toast'
import { createTeam } from '../api/teams'

const JOIN_METHOD_OPTIONS = [
  { value: 'team_page', label: 'Open (anyone can join)' },
  { value: 'link', label: 'Invite link only' },
  { value: 'manual', label: 'Manual (by invitation)' },
  { value: 'mixed', label: 'Open + invite link' },
]

interface FormErrors {
  name?: string
  capacity?: string
}

export default function CreateTeam() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [joinMethod, setJoinMethod] = useState('team_page')
  const [isVisible, setIsVisible] = useState(true)
  const [manualMembers, setManualMembers] = useState<string[]>([])

  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  function addMember() {
    setManualMembers((prev) => [...prev, ''])
  }

  function updateMember(i: number, val: string) {
    setManualMembers((prev) => prev.map((m, idx) => (idx === i ? val : m)))
  }

  function removeMember(i: number) {
    setManualMembers((prev) => prev.filter((_, idx) => idx !== i))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!name.trim()) e.name = 'Name is required'
    const cap = parseInt(capacity)
    if (!capacity || isNaN(cap) || cap < 2) e.capacity = 'Must be at least 2'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      const team = await createTeam({
        name: name.trim(),
        capacity: parseInt(capacity),
        join_method: joinMethod,
        is_visible: isVisible,
        manual_members: manualMembers.filter((m) => m.trim()).map((m) => ({ name: m.trim() })),
      })
      setToast({ message: 'Team created!', variant: 'success' })
      setTimeout(() => navigate(`/teams/${team.id}`), 1000)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to create team'
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>Create Team</h1>

        <form noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="Team Name *"
            placeholder="e.g. Eagles"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={loading}
          />

          <Input
            label="Capacity *"
            type="number"
            min={2}
            placeholder="e.g. 8"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            error={errors.capacity}
            disabled={loading}
          />

          <Select
            label="Join Method *"
            options={JOIN_METHOD_OPTIONS}
            value={joinMethod}
            onChange={(e) => setJoinMethod(e.target.value)}
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
            Visible in public listings
          </label>

          {/* Manual members */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>
                Manual Members
              </label>
              <button
                type="button"
                onClick={addMember}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
              >
                + Add Member
              </button>
            </div>
            {manualMembers.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input
                  value={m}
                  onChange={(e) => updateMember(i, e.target.value)}
                  placeholder={`Member ${i + 1} name`}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '0.65rem 0.85rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '0.9rem',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeMember(i)}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <FormError message={apiError} />

          <Button type="button" loading={loading} onClick={submit}>
            CREATE TEAM
          </Button>
        </form>
      </div>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
    </div>
  )
}
