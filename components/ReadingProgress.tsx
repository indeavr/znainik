import * as React from 'react'

/**
 * A thin gradient bar pinned to the top of the viewport that fills as the
 * reader scrolls through the page. Purely decorative and non-interactive.
 */
export function ReadingProgress() {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    let ticking = false

    function update() {
      const el = ref.current
      if (!el) return

      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const height =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0
      el.style.setProperty('--progress', String(progress))
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return <div ref={ref} className='reading-progress' aria-hidden='true' />
}
