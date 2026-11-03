import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { GET, POST } from '../app/api/auth/[...path]/route'
import {
  AuthError,
  gcApiUrl,
  getSession,
  sessionCookie,
  sessionFromToken
} from '../lib/auth'

const originalFetch = globalThis.fetch
const base = 'http://localhost:3410'
const user = {
  id: 'reader-id',
  email: 'reader@example.com',
  name: 'Читател',
  password: 'never return'
}
const context = (action: string) => ({
  params: Promise.resolve({ path: [action] })
})
const request = (action: string, body: unknown = {}, origin = base) =>
  new Request(`${base}/api/auth/${action}`, {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
const calls: { url: string; init?: RequestInit }[] = []

function mockBackend(status = 200) {
  globalThis.fetch = (async (url, init) => {
    calls.push({ url: String(url), init })
    return Response.json(
      String(url).endsWith('/user/me')
        ? { data: user }
        : { data: { token: 'test.gc.token', user } },
      { status }
    )
  }) as typeof fetch
}

afterEach(() => {
  globalThis.fetch = originalFetch
  calls.length = 0
})

void test('GC login uses backend credentials, validates user, and hides bearer token', async () => {
  mockBackend()
  const response = await POST(
    request('login', { email: '  Reader@Example.com ', password: 'secret' }),
    context('login')
  )
  assert.equal(response.status, 200)
  assert.equal(calls[0]?.url, `${gcApiUrl}/auth/login`)
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    email: 'reader@example.com',
    password: 'secret'
  })
  assert.equal(calls[1]?.url, `${gcApiUrl}/user/me`)
  assert.equal(
    (calls[1]?.init?.headers as Record<string, string>).Authorization,
    'Bearer test.gc.token'
  )
  const body = (await response.json()) as {
    session: { user: Record<string, unknown> }
    token?: unknown
  }
  assert.equal(body.session.user.id, 'gc:reader-id')
  assert.equal(body.session.user.password, undefined)
  assert.equal(body.token, undefined)
  assert.match(response.headers.get('set-cookie')!, /HttpOnly/i)
  assert.match(response.headers.get('set-cookie')!, /SameSite=lax/i)
  assert.doesNotMatch(response.headers.get('set-cookie')!, /Domain=/i)
  assert.equal(
    /; Secure/i.test(response.headers.get('set-cookie')!),
    process.env.NODE_ENV === 'production'
  )
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

void test('register creates a GC account with no marketing consent', async () => {
  mockBackend()
  const response = await POST(
    request('register', {
      email: 'reader@example.com',
      password: 'password123',
      name: ' Читател '
    }),
    context('register')
  )
  assert.equal(response.status, 200)
  assert.equal(calls[0]?.url, `${gcApiUrl}/auth/register`)
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    email: 'reader@example.com',
    password: 'password123',
    name: 'Читател',
    marketingOptIn: false
  })
})

void test('cross-site and missing-origin mutations are rejected before contacting GC', async () => {
  mockBackend()
  for (const action of ['login', 'register', 'logout']) {
    assert.equal(
      (
        await POST(
          request(action, {}, 'https://other.example'),
          context(action)
        )
      ).status,
      403
    )
    const req = request(action)
    req.headers.delete('origin')
    assert.equal((await POST(req, context(action))).status, 403)
  }
  assert.equal(calls.length, 0)
})

void test('bad credentials do not set cookies or return backend internals', async () => {
  mockBackend(401)
  const response = await POST(
    request('login', { email: 'reader@example.com', password: 'wrong' }),
    context('login')
  )
  assert.equal(response.status, 401)
  assert.equal(response.headers.get('set-cookie'), null)
  assert.equal(calls.length, 1)
})

void test('malformed input, JSON and oversized payloads do not reach backend', async () => {
  mockBackend()
  for (const body of [
    [],
    null,
    { email: 'invalid', password: 'x' },
    { email: 'reader@example.com', password: 123 }
  ]) {
    assert.equal(
      (await POST(request('login', body), context('login'))).status,
      400
    )
  }
  const req = new Request(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { origin: base, 'Content-Type': 'application/json' },
    body: '{'
  })
  assert.equal((await POST(req, context('login'))).status, 400)
  assert.equal(
    (await POST(request('login', { text: 'x'.repeat(9000) }), context('login')))
      .status,
    413
  )
  assert.equal(calls.length, 0)
})

void test('registration enforces password length without blocking existing short login passwords', async () => {
  mockBackend()
  assert.equal(
    (
      await POST(
        request('register', { email: 'reader@example.com', password: 'short' }),
        context('register')
      )
    ).status,
    400
  )
  assert.equal(
    (
      await POST(
        request('login', { email: 'reader@example.com', password: 'short' }),
        context('login')
      )
    ).status,
    200
  )
})

void test('anonymous session needs no backend request; old Neon and shared cookies do not authenticate', async () => {
  mockBackend()
  const response = await GET(
    new Request(`${base}/api/auth/session`, {
      headers: { cookie: 'token=old; neon-auth=legacy' }
    }),
    context('session')
  )
  assert.deepEqual(await response.json(), { session: null })
  assert.equal(calls.length, 0)
})

void test('expired or blocked GC account clears local session', async () => {
  for (const status of [401, 403]) {
    mockBackend(status)
    const response = await GET(
      new Request(`${base}/api/auth/session`, {
        headers: { cookie: `${sessionCookie}=expired.token` }
      }),
      context('session')
    )
    assert.deepEqual(await response.json(), { session: null })
    assert.match(response.headers.get('set-cookie')!, /Max-Age=0/i)
  }
})

void test('backend outage does not clear a valid cookie or masquerade as logged out', async () => {
  mockBackend(503)
  const response = await GET(
    new Request(`${base}/api/auth/session`, {
      headers: { cookie: `${sessionCookie}=valid.token` }
    }),
    context('session')
  )
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('set-cookie'), null)
})

void test('session projection rejects malformed upstream user', async () => {
  globalThis.fetch = (async () =>
    Response.json({ data: { name: 'Invalid' } })) as typeof fetch
  await assert.rejects(
    sessionFromToken('token'),
    (error: unknown) => error instanceof AuthError && error.status === 503
  )
})

void test('network failure is a retryable service error', async () => {
  globalThis.fetch = (async () => {
    throw new Error('private connection detail')
  }) as typeof fetch
  await assert.rejects(
    getSession(
      new Request(base, { headers: { cookie: `${sessionCookie}=token` } })
    ),
    (error: unknown) =>
      error instanceof AuthError &&
      error.status === 503 &&
      !error.message.includes('private')
  )
})

void test('logout clears only the Znainik cookie without mutating the GC account', async () => {
  mockBackend()
  const response = await POST(request('logout'), context('logout'))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('set-cookie')!, /Max-Age=0/i)
  assert.equal(calls.length, 0)
})

void test('unknown auth endpoints cannot proxy arbitrary backend paths', async () => {
  mockBackend()
  assert.equal((await POST(request('other'), context('other'))).status, 404)
  assert.equal((await GET(new Request(base), context('other'))).status, 404)
  assert.equal(calls.length, 0)
})
