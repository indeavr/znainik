import { FaFacebookF } from '@react-icons/all-files/fa/FaFacebookF'
import { FaLink } from '@react-icons/all-files/fa/FaLink'
import { FaLinkedinIn } from '@react-icons/all-files/fa/FaLinkedinIn'
import { FaShareAlt } from '@react-icons/all-files/fa/FaShareAlt'
import { FaTelegramPlane } from '@react-icons/all-files/fa/FaTelegramPlane'
import { FaTwitter } from '@react-icons/all-files/fa/FaTwitter'
import * as React from 'react'

/**
 * Stable canonical links also work before hydration; native share is opt-in.
 */
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [canShare, setCanShare] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setCanShare(typeof navigator.share === 'function')
  }, [])

  const enc = encodeURIComponent
  const shareText = enc(title)

  const onCopy = React.useCallback(async () => {
    try {
      setFailed(false)
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setFailed(true)
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
      <a
        className='zn-share-btn'
        href={`https://t.me/share/url?url=${enc(url)}&text=${shareText}`}
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Сподели в Telegram'
      >
        <FaTelegramPlane />
      </a>
      {canShare && (
        <button
          type='button'
          className='zn-share-btn'
          aria-label='Още начини за споделяне'
          onClick={() => {
            void navigator.share({ title, url }).catch(() => {})
          }}
        >
          <FaShareAlt />
        </button>
      )}
      <button
        type='button'
        className='zn-share-btn'
        onClick={onCopy}
        aria-label='Копирай връзката'
        title={copied ? 'Копирано!' : 'Копирай връзката'}
      >
        <FaLink />
      </button>
      {failed && (
        <span role='status'>
          Копирай връзката: <a href={url}>{url}</a>
        </span>
      )}
      {copied && (
        <span
          role='status'
          style={{ color: 'var(--brand-strong)', fontSize: '0.85rem' }}
        >
          Копирано!
        </span>
      )}
    </div>
  )
}
