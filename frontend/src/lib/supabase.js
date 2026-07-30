import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

// The shared demo account always maps to the fixed session id the backend
// seeds (backend/scripts/seed_demo_user.py) — never the Supabase auth UUID.
// Signing in as the demo user through this app-specific mapping keeps this
// mapping (rather than the raw UUID) as the source of truth regardless of
// which form was used to sign in.
const DEMO_EMAIL = 'demo@meridian.app'
const DEMO_SESSION_ID = 'demo-session'

function sessionIdFor(user) {
  if (!user) return null
  if ((user.email || '').toLowerCase() === DEMO_EMAIL) return DEMO_SESSION_ID
  return user.id
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser() {
  const session = await getSession()
  return session?.user || null
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
  try { localStorage.removeItem('meridian_session') } catch {}
}

export async function signInWithGoogle(nextPath = '/dashboard') {
  if (!supabase) throw new Error('Auth not configured')
  const redirectTo = window.location.origin + nextPath
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { access_type: 'offline', prompt: 'select_account' } },
  })
  if (error) throw error
  return data
}

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error('Auth not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithPassword(email, password, fullName = '') {
  if (!supabase) throw new Error('Auth not configured')
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: fullName ? { full_name: fullName } : undefined },
  })
  if (error) throw error
  return data
}

// When the user signs in, prefer the Supabase user id as the backend session key
// so profile/journey data survives across browsers and devices — except the
// demo account, which always maps to the fixed seeded session id. This listener
// fires asynchronously and is the last writer, so it must be the single place
// that decides the session id — a page-level override written before this
// fires gets silently clobbered otherwise.
if (supabase) {
  supabase.auth.onAuthStateChange((_evt, session) => {
    try {
      const id = sessionIdFor(session?.user)
      if (id) localStorage.setItem('meridian_session', id)
    } catch {}
  })
  // Also sync any pre-existing session on module load.
  supabase.auth.getSession().then(({ data }) => {
    try {
      const id = sessionIdFor(data.session?.user)
      if (id) localStorage.setItem('meridian_session', id)
    } catch {}
  })
}
