// src/mocks/config.ts
import { HttpResponse } from 'msw'
import { supabase } from '@shared/config/supabase'
import { MOCK_PERSONS } from './data/persons'

export async function getCurrentMockUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) return null
  const person = MOCK_PERSONS.find(p => p.email === session.user!.email)
  return person?.id ?? null
}

export async function getCurrentMockPerson() {
  const id = await getCurrentMockUserId()
  return id ? MOCK_PERSONS.find(p => p.id === id) ?? null : null
}

export function unauthorized() {
  return HttpResponse.json(
    { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
    { status: 401 },
  )
}

export function forbidden(msg = 'Forbidden') {
  return HttpResponse.json(
    { statusCode: 403, message: msg, error: 'Forbidden' },
    { status: 403 },
  )
}

export function notFound(msg = 'Not found') {
  return HttpResponse.json(
    { statusCode: 404, message: msg, error: 'Not Found' },
    { status: 404 },
  )
}

export function badRequest(messages: string[]) {
  return HttpResponse.json(
    { statusCode: 400, message: messages, error: 'Bad Request' },
    { status: 400 },
  )
}
