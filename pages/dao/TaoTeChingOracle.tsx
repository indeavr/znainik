"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useState } from "react";
import { FaQuoteLeft, FaQuoteRight, FaYinYang } from "react-icons/fa";

import { taoTeChingText } from '../../lib/dao/constants';
import styles from "./TaoTeChingOracle.module.css";

// Function to process the verses from a string
const processVersesFromString = (content: string): {[key: string]: string} => {
  const verses: {[key: string]: string} = {};
  
  // Updated regex to match the format "## N" or "## N - Title"
  // eslint-disable-next-line security/detect-unsafe-regex
  const verseRegex = /##\s*(\d+)(?:\s*-\s*[^\n]*)?/g;
  let match;
  let lastIndex = 0;
  let lastVerseNumber = "";
  
  while ((match = verseRegex.exec(content)) !== null) {
    // If we already found a verse number before, save the text between the last match and this one
    if (lastVerseNumber) {
      // Extract text up to the next heading or end, and remove any "---" dividers
      let verseText = content.slice(lastIndex, match.index!).trim();
      verseText = verseText.replace(/---\s*$/, '').trim(); // Remove trailing dividers
      verses[lastVerseNumber] = verseText;
    }
    
    lastVerseNumber = match[1]!;
    lastIndex = match.index! + match[0].length;
  }
  
  // Don't forget the last verse
  if (lastVerseNumber) {
    let verseText = content.slice(lastIndex).trim();
    verseText = verseText.replace(/---\s*$/, '').trim(); // Remove trailing dividers
    verses[lastVerseNumber] = verseText;
  }
  
  return verses;
};

export default function TaoTeChingOracle() {
  const [isConsulting, setIsConsulting] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<{number: string; text: string} | null>(null);
  const [taoVerses, setTaoVerses] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Process the verses directly from the string
    const processedVerses = processVersesFromString(taoTeChingText);
    setTaoVerses(processedVerses);
    setIsLoading(false);
  }, []);

  const consultOracle = () => {
    // Only allow consultation if verses are loaded
    if (Object.keys(taoVerses).length === 0) return;
    
    setIsConsulting(true);
    setSelectedVerse(null);
    
    // Simulate the oracle consultation with a delay
    setTimeout(() => {
      const verseNumbers = Object.keys(taoVerses);
      const randomIndex = Math.floor(Math.random() * verseNumbers.length);
      const randomVerseNumber = verseNumbers[randomIndex];
      if (randomVerseNumber) {
        const verseText = taoVerses[randomVerseNumber];
        if (verseText) {
          setSelectedVerse({
            number: randomVerseNumber,
            text: verseText
          });
        }
      }
      setIsConsulting(false);
    }, 389);
  };

  const resetOracle = () => {
    setSelectedVerse(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundImage}></div>
      <div className={styles.backgroundGradient}></div>
      
      <div className={styles.backNav}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/'}
          className={styles.backButton}
        >
          Обратно към Знайник
        </motion.button>
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Оракул на Дао Дъ Дзин
          </h1>
          <p className={styles.subtitle}>
            Получете мъдрост от древните стихове на Лао Дзъ.
          </p>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.consultingSpinner}></div>
            <p>Зареждане на стиховете...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!selectedVerse ? (
              <motion.div
                key="oracle-intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.introContainer}
              >
                <div className={styles.yinYangContainer}>
                  <div className={styles.yinYangGlow}></div>
                  <div className={styles.yinYangSymbol}>
                    <FaYinYang className={styles.yinYangIcon} />
                  </div>
                </div>
                
                <p className={styles.introText}>
                  Дао Дъ Дзин съдържа 81 стиха с древна мъдрост. Притихтене, задайте намерение и изтеглете стих от ученията на Лао Дзъ.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={consultOracle}
                  className={styles.consultButton}
                >
                  Изтегли
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="oracle-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.verseCard}
              >
                <div className={styles.verseNumber}>
                  <h2 className={styles.verseNumberText}>
                    Стих {selectedVerse.number}
                  </h2>
                </div>
                
                <div className={styles.verseContent}>
                  <FaQuoteLeft className={styles.quoteLeft} />
                  <p className={styles.verseText}>
                    {selectedVerse.text.split('\n').filter(line => line.trim() !== '').map((line, index, array) => (
                      <Fragment key={index}>
                        {line}
                        {index < array.length - 1 && <br />}
                      </Fragment>
                    ))}
                  </p>
                  <FaQuoteRight className={styles.quoteRight} />
                </div>
                
                <div className={styles.buttonGroup}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetOracle}
                    className={styles.consultAgainButton}
                  >
                    Изтегли отново
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        {isConsulting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.consultingOverlay}
          >
            <div className={styles.consultingContent}>
              <div className={styles.consultingSpinnerContainer}>
                <div className={styles.consultingSpinnerGlow}></div>
                <div className={styles.consultingSpinner}></div>
              </div>
              <p className={styles.consultingText}>Консултиране с Дао...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}