import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from 'chart.js';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useState } from 'react';

import styles from './content-calendar.module.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Dynamic import for Chart.js to avoid SSR issues
const Chart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
  ssr: false,
  loading: () => <div className={styles.chartPlaceholder}>Loading chart...</div>
});

interface CalendarDay {
  week: number;
  day: number;
  theme: string;
  description: string;
}

interface UserInput {
  notes: string;
  files: File[];
}

function ContentCalendarPage() {
  const [activeWeek, setActiveWeek] = useState(1);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [userInputs, setUserInputs] = useState<{ [key: number]: UserInput }>({});

  const calendarData: CalendarDay[] = [
    { week: 1, day: 1, theme: "Your Multipassionate Journey", description: "Share how combining multiple passions has created your unique approach. What lights you up about bringing different interests together? How has this benefited your clients?" },
    { week: 1, day: 2, theme: "Quick-Start Energy", description: "What's something you implemented quickly that got great results? Share your natural ability to move fast and skip steps while still getting to the destination." },
    { week: 1, day: 3, theme: "Passion-Fusion Spotlight", description: "Highlight how you combine two or more seemingly unrelated skills or interests into something uniquely valuable. What unexpected combination creates your special sauce?" },
    { week: 1, day: 4, theme: "Behind The Scenes", description: "Show yourself working on multiple projects simultaneously. How do you move between different aspects of your business with energy and enthusiasm?" },
    { week: 1, day: 5, theme: "Vision Declaration", description: "Share a vision you're excited about right now. Remember to INFORM your audience about where you're headed. What are you building that combines multiple interests?" },
    { week: 1, day: 6, theme: "Gut Response Story", description: "Share about a time you followed your gut and it led to something amazing. How did your quick response energy serve you and others?" },
    { week: 1, day: 7, theme: "Weekend Variety", description: "Share how your weekend reflects your multipassionate nature. How do your diverse interests feed into your business approach?" },
    { week: 2, day: 8, theme: "Efficiency Hack", description: "Share how you naturally find shortcuts that work. What's a process you've streamlined that your clients benefit from?" },
    { week: 2, day: 9, theme: "Multifaceted Approach", description: "How does your approach combine multiple methodologies or perspectives? Share how this versatility creates better results for your clients." },
    { week: 2, day: 10, theme: "Informed Pivot", description: "Share a pivot you've made in your business. Focus on how you informed your audience and how this agility benefited everyone." },
    { week: 2, day: 11, theme: "Client Transformation", description: "Showcase a client who benefited from your ability to see connections across different areas or implement solutions quickly." },
    { week: 2, day: 12, theme: "\"Yes AND\" Philosophy", description: "Share your perspective on embracing multiple interests rather than choosing just one path. How do you help clients embrace their own versatility?" },
    { week: 2, day: 13, theme: "Rapid Implementation", description: "Show something you implemented quickly based on a gut response. What results came from this fast action?" },
    { week: 2, day: 14, theme: "Vision", description: "Share what's exciting you about your business direction right now. What vision are you moving toward with enthusiasm?" },
    { week: 3, day: 15, theme: "Multipassionate Business Model", description: "Share how you've structured your business to incorporate multiple passions. How does this create a unique experience for your clients?" },
    { week: 3, day: 16, theme: "Quick Start Tutorial", description: "Teach something you're great at with emphasis on your efficient approach. How do you get results faster than the conventional method?" },
    { week: 3, day: 17, theme: "Versatility Advantage", description: "Explain how being multipassionate gives your clients an advantage. What unexpected combinations of skills do you bring to the table?" },
    { week: 3, day: 18, theme: "Inform About Offerings", description: "Share what you're currently offering with clarity and enthusiasm. Remember to INFORM before you act—let people know where you're headed." },
    { week: 3, day: 19, theme: "Productive Impatience", description: 'How has your "impatience" actually served you and your clients? Share how your quick energy helps create faster results.' },
    { week: 3, day: 20, theme: "Multiple Streams Spotlight", description: "Highlight the different income streams or service offerings in your business. How do they complement each other in serving your clients?" },
    { week: 3, day: 21, theme: "Integration Highlight", description: "Share how you integrate all your different passions and skills. What's your philosophy on embracing your whole self in business?" },
    { week: 4, day: 22, theme: "FAQ", description: "Address common questions about your multipassionate approach. How do you help clients understand the value of versatility?" },
    { week: 4, day: 23, theme: "Vision Invitation", description: "Invite your audience into your vision. What are you creating that they can be part of? Remember to inform them about your direction." },
    { week: 4, day: 24, theme: "Client Success Pattern", description: "Share a pattern you've noticed in your most successful clients. What qualities help them benefit most from your versatile approach?" },
    { week: 4, day: 25, theme: "Gut Response Offer", description: "Share an offer you're genuinely excited about right now. What lit you up about creating this opportunity?" },
    { week: 4, day: 26, theme: "Efficiency Blueprint", description: "Share your blueprint for helping clients embrace efficiency and versatility. How do you help them skip steps while still getting results?" },
    { week: 4, day: 27, theme: "Multipassionate Permission", description: "Give your audience permission to embrace all their interests. Share how you help clients integrate their multiple passions." },
    { week: 4, day: 28, theme: "Quick Implementation Challenge", description: "Offer a quick challenge that showcases your efficient approach. What can people implement today for a quick win?" },
    { week: 5, day: 29, theme: "Informed Next Steps", description: "Share what's coming next in your business journey. Remember to inform about your direction and any shifts in your focus." },
    { week: 5, day: 30, theme: "Celebration & Invitation", description: "Celebrate your multipassionate journey and extend an invitation to work with you. Share why your versatile approach creates unique results." }
  ];

  const weekTitles: { [key: number]: string } = {
    1: "Week 1: Showcase Your Versatility",
    2: "Week 2: Highlight Your Methodology",
    3: "Week 3: Demonstrate Your Expertise",
    4: "Week 4: Convert With Confidence",
    5: "Final Days"
  };

  const handleCardClick = (day: number) => {
    setExpandedCard(expandedCard === day ? null : day);
  };

  const handleNotesChange = (day: number, notes: string) => {
    setUserInputs(prev => ({
      ...prev,
      [day]: { ...prev[day], notes, files: prev[day]?.files || [] }
    }));
  };

  const handleFileUpload = (day: number, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setUserInputs(prev => ({
        ...prev,
        [day]: { ...prev[day], notes: prev[day]?.notes || '', files: fileArray }
      }));
    }
  };

  // Calculate theme distribution for chart
  const getThemeDistribution = () => {
    const themes: Record<string, number> = {};
    for (const day of calendarData) {
      if (day.theme) {
        themes[day.theme] = (themes[day.theme] || 0) + 1;
      }
    }
    return themes;
  };

  // Chart.js configuration
  const chartData = {
    labels: Object.keys(getThemeDistribution()),
    datasets: [
      {
        data: Object.values(getThemeDistribution()),
        backgroundColor: [
          '#A6907C',
          '#7B6857',
          '#D4C4B0',
          '#8B7355',
          '#C9B99B',
          '#9A8A7A'
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: 'Montserrat',
            size: 12
          }
        }
      }
    }
  };



  const getWeekDays = (week: number) => {
    return calendarData.filter(day => day.week === week);
  };



  return (
    <>
      <Head>
        <title>30-дневен календар за съдържание с AI | Znainik</title>
        <meta name="description" content="Интерактивен план за Манифестиращи Генератори" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            30-Day Content Calendar for Manifesting Generators ✨ AI Assistant
          </h1>
          <p className={styles.subtitle}>
            Interactive Plan for Manifesting Generators
          </p>
        </header>

        <main className={styles.main}>
          <section className={styles.calendarSection}>
            <div className={styles.description}>
              <p>
                This interactive calendar is designed to help you easily navigate through
                the 30-day content plan. Click on any day card to view the full description,
                add your notes and files, and use the AI assistant for generating personalized ideas.
              </p>
            </div>

            <div className={styles.tabs}>
              {Object.entries(weekTitles).map(([week, title]) => (
                <button
                  key={week}
                  className={`${styles.tab} ${activeWeek === Number.parseInt(week) ? styles.tabActive : styles.tabInactive}`}
                  onClick={() => setActiveWeek(Number.parseInt(week))}
                >
                  {title}
                </button>
              ))}
            </div>

            <div className={styles.content}>
              <div className={styles.grid}>
                {getWeekDays(activeWeek).map((day) => (
                  <motion.div
                    key={day.day}
                    className={`${styles.card} ${expandedCard === day.day ? styles.expanded : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: (day.day % 7) * 0.1 }}
                  >
                    <div className={styles.cardHeader} onClick={() => handleCardClick(day.day)}>
                      <div className={styles.cardHeaderTop}>
                        <div className={styles.dayNumber}>Ден {day.day}</div>
                        <div className={`${styles.expandIcon} ${expandedCard === day.day ? styles.expandIconRotated : ''}`}>
                          ▼
                        </div>
                      </div>
                      <h3 className={styles.cardTitle}>{day.theme}</h3>
                      <div className={styles.cardPreview}>
                        {day.description.slice(0, 80)}...
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedCard === day.day && (
                        <motion.div
                          className={styles.expandableContent}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className={styles.description}>{day.description}</p>
                          
                          <div className={styles.userInputSection}>
                            <label htmlFor={`notes-${day.day}`} className={styles.label}>Your Notes:</label>
                            <textarea
                              id={`notes-${day.day}`}
                              className={styles.textarea}
                              placeholder="Add your ideas here..."
                              value={userInputs[day.day]?.notes || ''}
                              onChange={(e) => handleNotesChange(day.day, e.target.value)}
                            />
                            
                            <label htmlFor={`files-${day.day}`} className={styles.label}>Attached Files:</label>
                            <input
                              id={`files-${day.day}`}
                              type="file"
                              multiple
                              className={styles.fileInput}
                              onChange={(e) => handleFileUpload(day.day, e.target.files)}
                            />
                            
                            {userInputs[day.day]?.files && userInputs[day.day]?.files && userInputs[day.day]!.files.length > 0 && (
                              <div className={styles.fileList}>
                                {userInputs[day.day]!.files.map((file, index) => (
                                  <span key={index} className={styles.fileName}>{file.name}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className={styles.aiSection}>
                            <div className={styles.comingSoonBtn}>
                              🤖 AI Generation - Coming Soon
                            </div>
                            <p className={styles.comingSoonText}>
                              We will soon add an AI assistant for personalized content ideas!
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Theme Distribution</h2>
              <p className={styles.summaryDescription}>
                This chart shows the distribution of content across the main thematic pillars of the calendar. 
                It gives you a quick overview of the focus of each phase of the 30-day plan, helping you understand 
                the strategic balance between showcasing your skills, methodology, expertise and attracting clients.
              </p>
              <div className={styles.chartContainer}>
                {Object.keys(getThemeDistribution()).length > 0 ? (
                  <Chart data={chartData} options={chartOptions} />
                ) : (
                  <div className={styles.chartPlaceholder}>
                    No theme data available yet. Add themes to your calendar entries to see the distribution.
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <p>&copy; 2025 Интерактивен Календар. Всички права запазени.</p>
        </footer>
      </div>
    </>
  );
};

export default ContentCalendarPage;
