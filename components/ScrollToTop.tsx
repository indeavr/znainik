import cs from 'classnames'
import * as React from 'react'

/**
 * A floating button that appears once the reader has scrolled down and smoothly
 * returns them to the top of the page.
 */
export function ScrollToTop() {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    let ticking = false

    function update() {
      setVisible((window.scrollY || document.documentElement.scrollTop) > 600)
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
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const onClick = React.useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <button
      type='button'
      aria-label='Нагоре'
      title='Нагоре'
      className={cs('scroll-top', visible && 'is-visible')}
      onClick={onClick}
    >
      <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        <path
          d='M12 19V5M12 5l-6 6M12 5l6 6'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </button>
  )
}
