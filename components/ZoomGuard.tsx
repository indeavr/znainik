import * as React from 'react'

/**
 * Article images open full screen with medium-zoom (inside react-notion-x). A broken image
 * can leave that viewer half-open, covering the page with no way to close it on a phone.
 * This guard keeps broken images from opening it, and makes any tap close an open viewer.
 */
export function ZoomGuard() {
  React.useEffect(() => {
    const broken = (img: HTMLImageElement) =>
      img.complete && img.naturalWidth === 0

    // Closes the viewer by hand: what medium-zoom does when its own close never finishes.
    const forceClose = () => {
      for (const node of document.querySelectorAll(
        '.medium-zoom-overlay, .medium-zoom-image--opened'
      )) {
        node.remove()
      }
      for (const img of document.querySelectorAll<HTMLImageElement>(
        '.medium-zoom-image--hidden'
      )) {
        img.classList.remove('medium-zoom-image--hidden')
        img.style.visibility = ''
      }
      document.body.classList.remove('medium-zoom--opened')
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target
      // A broken image does not open.
      if (
        target instanceof HTMLImageElement &&
        target.classList.contains('medium-zoom-image') &&
        !document.body.classList.contains('medium-zoom--opened') &&
        broken(target)
      ) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      // An open viewer closes on any tap; if it is still there shortly after, close it by hand.
      if (document.body.classList.contains('medium-zoom--opened')) {
        window.setTimeout(() => {
          if (document.body.classList.contains('medium-zoom--opened'))
            forceClose()
        }, 500)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') window.setTimeout(forceCloseIfStuck, 500)
    }
    const forceCloseIfStuck = () => {
      if (document.body.classList.contains('medium-zoom--opened')) forceClose()
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('keyup', onKey)
    window.addEventListener('popstate', forceCloseIfStuck)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keyup', onKey)
      window.removeEventListener('popstate', forceCloseIfStuck)
      forceCloseIfStuck()
    }
  }, [])

  return null
}
