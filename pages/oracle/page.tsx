import Head from 'next/head'
import { useEffect,useState } from 'react'

import styles from '@/styles/Oracle.module.css'

import taoVerses from './dao.json'

export default function OraclePage() {
  const [verse, setVerse] = useState<string>('')
  const [verseNumber, setVerseNumber] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Function to get a random verse
  const getRandomVerse = () => {
    setIsLoading(true)
    // Generate a random number between 1 and 81
    // const lenght = Object.keys(taoVerses).length;
    const randomNum = Math.floor(Math.random() * 25) + 1
    setVerseNumber(randomNum)
    setVerse(taoVerses[randomNum.toString()])
    setIsLoading(false)
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

      <main className={styles.main}>
        <h1 className={styles.title}>Дао Дъ Дзин Оракул</h1>
        
        <p className={styles.description}>
        Дневни Съзерцания от Лао Дзъ
        </p>

        <div className={styles.oracleCard}>
          {isLoading ? (
            <p>Търсене на мъдрост...</p>
          ) : (
            <>
              <h2 className={styles.verseNumber}>Номер {verseNumber}</h2>
              <blockquote className={`${styles.verse} whitespace-pre-line`}>
                {verse}
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