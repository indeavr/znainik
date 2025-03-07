'use client'

import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HiArrowLeft, HiRefresh } from 'react-icons/hi'

import taoVerses from './dao.json'

export default function OraclePage() {
  const [verse, setVerse] = useState<string>('')
  const [verseNumber, setVerseNumber] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Function to get a random verse
  const getRandomVerse = () => {
    setIsLoading(true)
    // Generate a random number between 1 and 81
    const lenght = Object.keys(taoVerses).length;
    const randomNum = Math.floor(Math.random() * lenght) + 1
    setVerseNumber(randomNum)
    setVerse(taoVerses[randomNum.toString()])
    setIsLoading(false)
  }

  // Get a random verse on initial load
  useEffect(() => {
    getRandomVerse()
  }, [])

  return (
    <div 
      className="min-h-screen pt-16 pb-8 px-2 sm:px-4 relative bg-cover bg-center"
      style={{
        backgroundImage: 'url("/dao-background.png")',
        backgroundAttachment: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}
    >
      {/* Darker overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-gray-900/75 to-black/80 z-0 fixed"></div>
      
      <Head>
        <title>Дао Дъ Дзин Оракул | Дневни Съзерцания </title>
        <meta name="description" content="Get your daily insight from the Tao Te Ching" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-black/90 to-gray-900/90 backdrop-blur-md z-10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center text-white hover:text-yellow-300 transition-colors">
            <HiArrowLeft className="mr-2 h-5 w-5" />
            <span className="font-medium">Към Знайник</span>
          </Link>
        </div>
      </nav>

      <div className="w-full max-w-4xl mx-auto relative z-1">
        <main className="flex flex-col items-center w-full">
          <div className="mb-8 sm:mb-12 text-center w-full">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center text-white mb-2 sm:mb-3 drop-shadow-lg">
              Дао Дъ Дзин Оракул
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-center text-yellow-100 drop-shadow-md">
              Дневни Съзерцания от Лао Дзъ
            </p>
          </div>

          <div className="w-full max-w-3xl mx-auto mb-6 sm:mb-10 overflow-hidden rounded-lg bg-white shadow-lg border border-yellow-200/30">
            <div className="p-4 sm:p-6 md:p-10">
              {isLoading ? (
                <div className="flex justify-center items-center h-32 sm:h-40">
                  <div className="animate-spin h-8 w-8 sm:h-10 sm:w-10 border-4 border-yellow-600 border-t-transparent rounded-full"></div>
                  <span className="ml-3 text-gray-800 text-base sm:text-lg">Търсене на мъдрост...</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 border-b border-yellow-200 pb-4">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2 sm:mb-0">Номер {verseNumber}</h2>
                    <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium self-start sm:self-auto">Дао Дъ Дзин</span>
                  </div>
                  <blockquote className="whitespace-pre-line text-sm sm:text-base md:text-lg leading-relaxed text-gray-800 border-l-4 border-yellow-600 pl-4 sm:pl-6 py-2 italic font-medium">
                    {verse}
                  </blockquote>
                </>
              )}
            </div>
          </div>

          <button 
            onClick={getRandomVerse}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center rounded-lg text-gray-900 bg-yellow-500 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium shadow-lg transition-all duration-300 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiRefresh className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
            Нов стих
          </button>
        </main>

        <footer className="mt-10 sm:mt-16 text-center text-white text-xs sm:text-sm">
          <p>Дао Дъ Дзин • Древна мъдрост за модерни времена</p>
        </footer>
      </div>
    </div>
  )
}