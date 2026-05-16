/**
 * Extract a human-readable message from an axios/fetch error of unknown shape.
 *
 * Looks for response.data.detail, response.data.message, then top-level message.
 * Falls back to the supplied default.
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err && typeof err === 'object') {
    const e = err as {
      response?: { data?: { detail?: unknown; message?: unknown } }
      message?: unknown
    }
    const detail = e.response?.data?.detail
    if (typeof detail === 'string') return detail
    const message = e.response?.data?.message
    if (typeof message === 'string') return message
    if (typeof e.message === 'string') return e.message
  }
  return fallback
}
