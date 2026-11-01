import { create } from 'zustand'

const readInitial = () => {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch (e) {
    /* storage unavailable */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const apply = theme => {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem('theme', theme)
  } catch (e) {
    /* ignore */
  }
}

export const useThemeStore = create((set, get) => ({
  theme: readInitial(),
  setTheme: theme => {
    apply(theme)
    set({ theme })
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark')
}))
