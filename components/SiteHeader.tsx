import { FaYinYang } from '@react-icons/all-files/fa/FaYinYang'
import { IoBookOutline } from '@react-icons/all-files/io5/IoBookOutline'
import { IoGlobeOutline } from '@react-icons/all-files/io5/IoGlobeOutline'
import { IoHomeOutline } from '@react-icons/all-files/io5/IoHomeOutline'
import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoPricetagsOutline } from '@react-icons/all-files/io5/IoPricetagsOutline'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import cs from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/router'
import * as React from 'react'

import { BrandLogo } from '@/components/BrandLogo'
import { openCommandPalette } from '@/components/CommandPalette'
import { brand } from '@/lib/brand'
import * as config from '@/lib/config'
import { useDarkMode } from '@/lib/use-dark-mode'

interface NavItem {
  href: string
  label: string
  active?: string
  external?: boolean
  icon: React.ReactNode
}

const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Начало', active: 'home', icon: <IoHomeOutline /> },
  { href: '/tags', label: 'Теми', active: 'tags', icon: <IoPricetagsOutline /> },
  {
    href: '/prikazki',
    label: 'Приказки',
    active: 'prikazki',
    icon: <IoBookOutline />
  },
  { href: '/dao', label: 'Дао', active: 'dao', icon: <FaYinYang /> }
]

/**
 * Brand header for the custom (non-Notion-rendered) pages: home, tags, etc.
 * Desktop shows inline navigation; mobile collapses into a modern full-screen
 * menu toggled by an animated burger button.
 */
export function SiteHeader({ active }: { active?: string }) {
  const [mounted, setMounted] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const router = useRouter()

  React.useEffect(() => setMounted(true), [])

  // close the mobile menu whenever navigation happens
  React.useEffect(() => {
    const close = () => setMenuOpen(false)
    router.events.on('routeChangeStart', close)
    return () => router.events.off('routeChangeStart', close)
  }, [router])

  // Esc to close + lock background scroll while the menu is open
  React.useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  const extraLinks = (config.navigationLinks || []).filter(
    (link): link is NonNullable<typeof link> =>
      Boolean(link?.url || link?.pageId)
  )

  return (
    <>
      <header className={cs('zn-header', menuOpen && 'is-menu-open')}>
        <div className='zn-container zn-header-inner'>
        <Link href='/' className='zn-brand' aria-label={config.name}>
          <BrandLogo variant='header' priority />
          <span>{brand.siteName}</span>
        </Link>

        {/* Desktop navigation */}
        <nav className='zn-nav zn-nav-desktop'>
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className='zn-nav-link'
              data-active={item.active ? active === item.active : undefined}
            >
              {item.label}
            </Link>
          ))}

          {extraLinks.map((link, index) => (
            <a
              key={index}
              href={link.url || `/${link.pageId}`}
              className='zn-nav-link zn-nav-link-extra'
              target={link.url ? '_blank' : undefined}
              rel={link.url ? 'noopener noreferrer' : undefined}
            >
              {link.title}
            </a>
          ))}

          <button
            type='button'
            className='zn-search-trigger'
            onClick={openCommandPalette}
            aria-label='Търсене'
          >
            <SearchIcon />
            <span className='zn-search-label'>Търси</span>
            <span className='zn-kbd'>⌘K</span>
          </button>

          <button
            type='button'
            className='zn-icon-btn'
            onClick={toggleDarkMode}
            aria-label='Превключи тема'
            style={{ visibility: mounted ? 'visible' : 'hidden' }}
          >
            {mounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
          </button>
        </nav>

        {/* Mobile actions */}
        <div className='zn-header-mobile'>
          <button
            type='button'
            className='zn-icon-btn'
            onClick={openCommandPalette}
            aria-label='Търсене'
          >
            <SearchIcon />
          </button>
          <button
            type='button'
            className='zn-icon-btn'
            onClick={toggleDarkMode}
            aria-label='Превключи тема'
            style={{ visibility: mounted ? 'visible' : 'hidden' }}
          >
            {mounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
          </button>
          <button
            type='button'
            className={cs('zn-burger', menuOpen && 'is-open')}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Затвори менюто' : 'Отвори менюто'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        </div>
      </header>

      {mounted && menuOpen && (
        <div className='zn-mobile-overlay'>
          <button
            type='button'
            className='zn-mobile-backdrop'
            aria-label='Затвори менюто'
            onClick={() => setMenuOpen(false)}
          />
          <div
            className='zn-mobile-menu'
            role='dialog'
            aria-modal='true'
            aria-label='Навигация'
          >
            <nav className='zn-container zn-mobile-nav'>
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className='zn-mobile-link'
                  data-active={
                    item.active ? active === item.active : undefined
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <span className='zn-mobile-link-start'>
                    <span className='zn-mobile-link-icon' aria-hidden='true'>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  <span className='zn-mobile-link-arrow' aria-hidden='true'>
                    →
                  </span>
                </Link>
              ))}

              {extraLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url || `/${link.pageId}`}
                  className='zn-mobile-link'
                  target={link.url ? '_blank' : undefined}
                  rel={link.url ? 'noopener noreferrer' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className='zn-mobile-link-start'>
                    <span className='zn-mobile-link-icon' aria-hidden='true'>
                      <IoGlobeOutline />
                    </span>
                    {link.title}
                  </span>
                  <span className='zn-mobile-link-arrow' aria-hidden='true'>
                    →
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

function SearchIcon() {
  return (
    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <circle cx='11' cy='11' r='7' stroke='currentColor' strokeWidth='2' />
      <path
        d='M21 21l-4.3-4.3'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}
