import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

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
// so profile/journey data survives across browsers and devices.
if (supabase) {
  supabase.auth.onAuthStateChange((_evt, session) => {
    try {
      if (session?.user?.id) localStorage.setItem('meridian_session', session.user.id)
    } catch {}
  })
  // Also sync any pre-existing session on module load.
  supabase.auth.getSession().then(({ data }) => {
    try {
      if (data.session?.user?.id) localStorage.setItem('meridian_session', data.session.user.id)
    } catch {}
  })
}
