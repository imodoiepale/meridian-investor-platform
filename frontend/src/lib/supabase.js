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
