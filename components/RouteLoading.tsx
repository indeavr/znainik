import { useRouter } from 'next/router'
import * as React from 'react'

export function RouteLoading() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = () => {
      clearTimeout(timer)
      setLoading(false)
    }
    const start = (_url: string, { shallow }: { shallow: boolean }) => {
      finish()
      if (!shallow) timer = setTimeout(() => setLoading(true), 160)
    }
    router.events.on('routeChangeStart', start)
    router.events.on('routeChangeComplete', finish)
    router.events.on('routeChangeError', finish)
    return () => {
      clearTimeout(timer)
      router.events.off('routeChangeStart', start)
      router.events.off('routeChangeComplete', finish)
      router.events.off('routeChangeError', finish)
    }
  }, [router.events])

  return loading ? (
    <div className='zn-route-loading' role='status' aria-live='polite'>
      <span className='zn-route-loading-bar' aria-hidden='true' />
      <span className='zn-route-loading-label'>Зареждане…</span>
    </div>
  ) : null
}
