"use client";

import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaYinYang, FaQuoteLeft, FaQuoteRight, FaRedo } from "react-icons/fa";

// The 81 verses of the Tao Te Ching
import taoVerses from "./dao.json";
import styles from "./TaoTeChingOracle.module.css";

export default function TaoTeChingOracle() {
  const [isConsulting, setIsConsulting] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<{number: string; text: string} | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);

  const consultOracle = () => {
    setIsConsulting(true);
    setSelectedVerse(null);
    setShowReflection(false);
    
    // Simulate the oracle consultation with a delay
    setTimeout(() => {
      const verseNumbers = Object.keys(taoVerses);
      const randomVerseNumber = verseNumbers[Math.floor(Math.random() * verseNumbers.length)];
      setSelectedVerse({
        number: randomVerseNumber,
        text: taoVerses[randomVerseNumber]
      });
      setIsConsulting(false);
    }, 389);
  };

  const generateReflection = async () => {
    if (!selectedVerse) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/oracle/reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verse: selectedVerse.text,
          verseNumber: selectedVerse.number,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate reflection');
      }
      
      const data = await response.json();
      setReflection(data.reflection);
      setShowReflection(true);
    } catch (error) {
      console.error('Error generating reflection:', error);
      setReflection("Дао мълчи в този момент. Моля, опитайте отново по-късно.");
      setShowReflection(true);
    } finally {
      setLoading(false);
    }
  };

  const resetOracle = () => {
    setSelectedVerse(null);
    setShowReflection(false);
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
            Потърсете мъдрост от древните стихове на Лао Дзъ.
          </p>
        </div>
        
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
                  {selectedVerse.text.split('\n').map((line, index) => (
                    <Fragment key={index}>
                      {line}
                      {index < selectedVerse.text.split('\n').length - 1 && <br />}
                    </Fragment>
                  ))}
                </p>
                <FaQuoteRight className={styles.quoteRight} />
              </div>
              
              <AnimatePresence>
                {!showReflection ? (
                  <motion.div
                    key="reflection-prompt"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={styles.reflectionPrompt}
                  >
                    {/* <p className={styles.promptText}>
                      Желаете ли да получите лично размишление за това как този стих може да се отнася към вашата ситуация?
                    </p> */}
                    <div className={styles.buttonGroup}>
                      {/* <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generateReflection}
                        disabled={loading}
                        className={styles.reflectionButton}
                      >
                        {loading ? (
                          <span className={styles.loadingIndicator}>
                            <div className={styles.spinner}></div>
                            Размишлява...
                          </span>
                        ) : (
                          "Потърси размишление"
                        )}
                      </motion.button> */}
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
                ) : (
                  <motion.div
                    key="reflection-result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.reflectionSection}
                  >
                    <h3 className={styles.reflectionTitle}>
                      Размишление
                    </h3>
                    <div className={styles.reflectionContent}>
                      <p className={styles.reflectionText}>
                        {reflection}
                      </p>
                    </div>
                    <div className={styles.buttonContainer}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resetOracle}
                        className={styles.reflectionButton}
                      >
                        <FaRedo /> Консултирай се отново
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        
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