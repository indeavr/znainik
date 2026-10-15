import { AnimatePresence, motion } from 'framer-motion'
import { type GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

import { getArticlesFromRecordMap } from '@/lib/get-articles'
import { notion } from '@/lib/notion-api'
import { withNotionRetry } from '@/lib/notion-retry'

import styles from './oracle.module.css'

interface OracleCard {
  id: string
  title: string
  emoji: string
  date: string | null
  description: string
}

interface OracleProps {
  cards: OracleCard[]
}

export const getStaticProps: GetStaticProps<OracleProps> = async () => {
  const pageId = '19dd629f9cd280989eccfc6937f49bbb'
  const recordMap = await withNotionRetry(() =>
    notion.getPage(pageId, {
      concurrency: 1,
      signFileUrls: false,
      maxViewsPerCollection: 1,
      throwOnCollectionErrors: true
    })
  )
  const cards = getArticlesFromRecordMap(recordMap, pageId)
    .slice(0, 64)
    .map((article) => ({
      id: article.pageId,
      title: article.title,
      emoji: article.emoji || '🔮',
      date: article.date
        ? new Date(article.date).toISOString().slice(0, 10)
        : null,
      description: article.description
    }))
  return { props: { cards }, revalidate: 60 }
}

export default function OraclePage({ cards: oracleCards }: OracleProps) {
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCardClick = (card: OracleCard) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Оракул | Знайник · Азайра</title>
        <meta
          name='description'
          content='Галерия от 64 оракулски карти за медитация и съзерцание'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className={styles.backgroundImage} />
      <div className={styles.backgroundGradient} />

      <nav className={styles.navigation}>
        <Link href='/' className={styles.backLink}>
          ← Към Знайник
        </Link>
      </nav>

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Оракул</h1>
          <p className={styles.subtitle}>
            Галерия от 64 карти за медитация и съзерцание
          </p>
        </header>

        {oracleCards.length === 0 && (
          <p role='status'>Все още няма публикувани карти.</p>
        )}
        <div className={styles.gallery}>
          {oracleCards.map((card, index) => (
            <motion.button
              type='button'
              key={card.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => handleCardClick(card)}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardEmoji}>{card.emoji}</div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDate}>{card.date}</p>
              </div>
              <div className={styles.cardOverlay}>
                <span>Виж карта</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedCard && (
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.closeButton} onClick={closeModal}>
                ×
              </button>
              <div className={styles.modalCard}>
                <div className={styles.modalEmoji}>{selectedCard.emoji}</div>
                <h2 className={styles.modalTitle}>{selectedCard.title}</h2>
                <p className={styles.modalDate}>{selectedCard.date}</p>
                <p className={styles.modalDescription}>
                  {selectedCard.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
