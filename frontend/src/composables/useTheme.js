import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'meridian-theme'
const isDark = ref(localStorage.getItem(STORAGE_KEY) !== 'light')

watchEffect(() => {
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
})

export function useTheme() {
  const toggle = () => { isDark.value = !isDark.value }
  return { isDark, toggle }
}
