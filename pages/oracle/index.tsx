import { AnimatePresence, motion } from 'framer-motion'
import { type GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import {
  getNotionBlockValue,
  getNotionCollectionValue,
  getNotionCollectionViewValue
} from '@/lib/get-notion-block-value'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps } from '@/lib/types'

import styles from './oracle.module.css'

interface OracleCard {
  id: string
  title: string
  emoji: string
  date: string
  description: string
}

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    // Fetch the oracle Notion page data
    console.log("OPA")
    const props = await resolveNotionPage(domain, '19dd629f9cd280989eccfc6937f49bbb')
    return { props, revalidate: 10 }
  } catch (err) {
    console.error('oracle page error', err)
    throw err
  }
}

export default function OraclePage(props: PageProps) {
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  console.log("GG")
  // Extract oracle cards from Notion data
  const extractOracleCards = (): OracleCard[] => {
    if (!props.recordMap?.collection) return []
    
    const cards: OracleCard[] = []
    const collections = Object.values(props.recordMap.collection)
    
    for (const collection of collections) {
      const coll = getNotionCollectionValue(collection)
      if (!coll?.id) continue

      const collectionId = coll.id

      const collectionView = Object.values(
        props.recordMap?.collection_view || {}
      ).find((view) => {
        const v = getNotionCollectionViewValue(view)
        if (!v) return false
        const withCollId = v as { collection_id?: string }
        return (
          withCollId.collection_id === collectionId || v.parent_id === collectionId
        )
      })

      const viewUnwrapped = getNotionCollectionViewValue(collectionView)
      if (viewUnwrapped && (viewUnwrapped as { page_sort?: string[] }).page_sort) {
        const pageSort = (viewUnwrapped as { page_sort: string[] }).page_sort
          for (const [index, pageId] of pageSort.entries()) {
            const block = getNotionBlockValue(props.recordMap?.block?.[pageId])
            if (block && block.type === 'page') {
              const properties = block.properties as any || {}
              
              const title = properties.title?.[0]?.[0] || `Card ${index + 1}`
                 const emoji = block.format?.page_icon || '🔮'
                 const date = properties.date?.[0]?.[1]?.[0]?.[1]?.start_date || new Date().toISOString().split('T')[0]
                 const description = properties.description?.[0]?.[0] || 'Медитирай върху тази карта'
                 
                 cards.push({
                   id: pageId,
                   title: typeof title === 'string' ? title : String(title),
                   emoji: typeof emoji === 'string' ? emoji : String(emoji),
                   date: typeof date === 'string' ? date : String(date),
                   description: typeof description === 'string' ? description : String(description)
                 })
            }
          }
        }
    }
    
    // If no cards found, generate placeholder cards
    if (cards.length === 0) {
      for (let i = 1; i <= 64; i++) {
        const emojis: readonly string[] = ['🔮', '✨', '🌟', '💫', '🌙', '☯️', '🕯️', '🔯'] as const
           const emojiIndex = (i - 1) % emojis.length
           cards.push({
              id: `card-${i}`,
              title: `Карта ${i}`,
              emoji: emojis[emojiIndex] || '🔮',
              date: new Date().toISOString().split('T')[0] || '',
              description: 'Медитирай върху тази карта'
            })
      }
    }
    
    return cards.slice(0, 64) // Ensure exactly 64 cards
  }

  const oracleCards = extractOracleCards()

  const handleCardClick = (card: OracleCard) => {
    setSelectedCard(card)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedCard(null), 300)
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Оракул | Azaira Znainik</title>
        <meta name="description" content="Галерия от 64 оракулски карти за медитация и съзерцание" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.backgroundImage} />
      <div className={styles.backgroundGradient} />

      <nav className={styles.navigation}>
        <Link href="/" className={styles.backLink}>
          ← Към Знайник
        </Link>
      </nav>

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Оракул</h1>
          <p className={styles.subtitle}>Галерия от 64 карти за медитация и съзерцание</p>
        </header>

        <div className={styles.gallery}>
          {oracleCards.map((card, index) => (
            <motion.div
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
            </motion.div>
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
                <p className={styles.modalDescription}>{selectedCard.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render the actual Notion page content if needed */}
      <div style={{ display: 'none' }}>
        <NotionPage {...props} />
      </div>
    </div>
  )
}