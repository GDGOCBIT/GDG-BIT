import LetterGlitch from './LetterGlitch'
import { useThemeStore } from '../store/useThemeStore'

// Only the four Google / GDG colours pop out of the faint letter field.
const GDG = ['#4285f4', '#ea4335', '#f9ab00', '#34a853']
const GDG_DARK = ['#8ab4f8', '#f28b82', '#fdd663', '#81c995']

/** Site-wide background: subtle, theme aware, brand-coloured letter glitch. */
export default function GlitchBackground () {
  const dark = useThemeStore(s => s.theme === 'dark')
  return (
    <LetterGlitch
      aria-hidden='true'
      lightMode={!dark}
      glitchColors={dark ? GDG_DARK : GDG}
      baseColor={dark ? '#e8eaed' : '#1e1e1e'}
      baseOpacity={dark ? 0.11 : 0.09}
      characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{}[]/=+-*;:#&'
      fontFamily="'Google Sans Code', 'Roboto Mono', ui-monospace, monospace"
      fontSize={15}
      spacing={0.7}
      density={0.85}
      glitchAmount={0.62}
      speed={0.85}
      flow={0.75}
      interactive
      cursorRadius={170}
      repel={0.42}
      clickEffect='none'
      style={{ opacity: 1 }}
    />
  )
}
