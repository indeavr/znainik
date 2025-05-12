import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import styles from '@/styles/Oracle.module.css'

export default function OraclePage() {
  const [verseNumber, setVerseNumber] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Function to get a random verse number
  const getRandomVerse = () => {
    setIsLoading(true)
    // Generate a random number between 1 and 81
    const randomNum = Math.floor(Math.random() * 81) + 1
    setVerseNumber(randomNum)
    setTimeout(() => {
      setIsLoading(false)
    }, 500) // Small delay for loading effect
  }

  // Get a random verse on initial load
  useEffect(() => {
    getRandomVerse()
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Дао Дъ Дзин Оракул | Дневни Съзерцания </title>
        <meta name="description" content="Get your daily insight from the Tao Te Ching" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className={styles.navigation}>
        <Link href="/" className={styles.backLink}>
          ← Към Знайник
        </Link>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>Дао Дъ Дзин Оракул</h1>
        
        <p className={styles.description}>
        Дневни Съзерцания от Лао Дзъ
        </p>

        <div className={styles.oracleCard}>
          {isLoading ? (
            <p>Получаване на мъдрост...</p>
          ) : (
            <>
              <h2 className={styles.verseNumber}>Номер {verseNumber}</h2>
              <blockquote className={`${styles.verse} whitespace-pre-line`}>
                Отворете Дао Дъ Дзин на стих {verseNumber} и съзерцавайте неговата мъдрост.
              </blockquote>
            </>
          )}
        </div>

        <button 
          className={styles.button} 
          onClick={getRandomVerse}
          disabled={isLoading}
        >
          Нов
        </button>
      </main>
    </div>
  )
}