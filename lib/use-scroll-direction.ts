import * as React from 'react'

/**
 * Returns true when the header should be hidden (user scrolled down),
 * false when it should be visible (user scrolled up or near top).
 */
export function useHeaderHidden(): boolean {
  const [hidden, setHidden] = React.useState(false)
  const lastScrollY = React.useRef(0)
  const ticking = React.useRef(false)

  React.useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY ?? window.pageYOffset
      if (scrollY <= 0) {
        setHidden(false)
        lastScrollY.current = scrollY
        return
      }
      const delta = scrollY - lastScrollY.current
      lastScrollY.current = scrollY
      if (Math.abs(delta) < 10) return
      if (delta > 0) setHidden(true)
      else setHidden(false)
    }

    function requestTick() {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(() => {
          onScroll()
          ticking.current = false
        })
      }
    }

    window.addEventListener('scroll', requestTick, { passive: true })
    return () => window.removeEventListener('scroll', requestTick)
  }, [])

  return hidden
}
