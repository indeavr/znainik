'use client'

import { PageHead } from '@/components/PageHead'

import TaoTeChingOracle from './TaoTeChingOracle'

export default function Oracle() {
  return (
    <>
      <PageHead
        title='Дао Дъ Дзин — стихове за съзерцание | Знайник'
        description='Открий стих от Дао Дъ Дзин за размисъл и съзерцание. Древна мъдрост и вдъхновение в Знайник — живата библиотека на Азайра.'
      />
      <TaoTeChingOracle />
    </>
  )
}
