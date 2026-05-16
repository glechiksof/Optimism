import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('returns response.data.detail when a string', () => {
    const err = { response: { data: { detail: 'Email already registered' } } }
    expect(getErrorMessage(err)).toBe('Email already registered')
  })

  it('returns response.data.message when detail absent', () => {
    const err = { response: { data: { message: 'Something went wrong' } } }
    expect(getErrorMessage(err)).toBe('Something went wrong')
  })

  it('returns top-level message when no response data', () => {
    const err = { message: 'Network Error' }
    expect(getErrorMessage(err)).toBe('Network Error')
  })

  it('returns fallback for null', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong')
  })

  it('returns fallback for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Something went wrong')
  })

  it('returns custom fallback when provided', () => {
    expect(getErrorMessage(null, 'Custom error')).toBe('Custom error')
  })

  it('skips non-string detail (array) and falls through to message', () => {
    const err = {
      response: { data: { detail: [{ msg: 'field error' }] } },
      message: 'fallback msg',
    }
    expect(getErrorMessage(err)).toBe('fallback msg')
  })

  it('returns fallback when error is a plain string', () => {
    expect(getErrorMessage('oops')).toBe('Something went wrong')
  })

  it('returns fallback when response.data is null', () => {
    const err = { response: { data: null }, message: 'top msg' }
    expect(getErrorMessage(err)).toBe('top msg')
  })
})
