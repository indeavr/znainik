import cs from 'classnames'
import * as React from 'react'

import { brand, type BrandLogoVariant } from '@/lib/brand'

const SIZES: Record<
  BrandLogoVariant,
  { width: number; height: number; className: string }
> = {
  header: { width: 36, height: 36, className: 'zn-brand-logo-symbol' },
  wordmark: { width: 180, height: 40, className: 'zn-brand-logo-wordmark' },
  icon: { width: 32, height: 32, className: 'zn-brand-logo-icon' },
  appIcon: { width: 48, height: 48, className: 'zn-brand-logo-app' },
  lockup: { width: 44, height: 44, className: 'zn-brand-logo-lockup' }
}

export function BrandLogo({
  variant = 'header',
  className,
  priority
}: {
  variant?: BrandLogoVariant
  className?: string
  /** Set on above-the-fold marks (header). */
  priority?: boolean
}) {
  const { width, height, className: sizeClass } = SIZES[variant]
  const src = brand.logos[variant]

  return (
    <img
      src={src}
      alt={brand.alt}
      width={width}
      height={height}
      className={cs(sizeClass, className)}
      decoding='async'
      fetchPriority={priority ? 'high' : undefined}
    />
  )
}
