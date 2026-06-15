import { FaFacebookF } from '@react-icons/all-files/fa/FaFacebookF'
import { FaLink } from '@react-icons/all-files/fa/FaLink'
import { FaLinkedinIn } from '@react-icons/all-files/fa/FaLinkedinIn'
import { FaTwitter } from '@react-icons/all-files/fa/FaTwitter'
import * as React from 'react'

/**
 * Social share row for articles. Resolves the canonical URL on the client and
 * supports a native copy-to-clipboard fallback.
 */
export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const enc = encodeURIComponent
  const shareText = enc(title)

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }, [url])

  return (
    <div className='zn-article-extras zn-share'>
      <span className='zn-share-label'>Сподели:</span>

      <a
        className='zn-share-btn'
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Сподели във Facebook'
      >
        <FaFacebookF />
      </a>
      <a
        className='zn-share-btn'
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${shareText}`}
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Сподели в X'
      >
        <FaTwitter />
      </a>
      <a
        className='zn-share-btn'
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Сподели в LinkedIn'
      >
        <FaLinkedinIn />
      </a>
      <button
        type='button'
        className='zn-share-btn'
        onClick={onCopy}
        aria-label='Копирай връзката'
        title={copied ? 'Копирано!' : 'Копирай връзката'}
      >
        <FaLink />
      </button>
      {copied && (
        <span style={{ color: 'var(--brand-strong)', fontSize: '0.85rem' }}>
          Копирано!
        </span>
      )}
    </div>
  )
}
