import React, { useState, useEffect } from "react";

// Curated robust intermediate-to-advanced fallback vocabulary quiz
const FALLBACK_QUIZ = [
  {
    word: "Pragmatic",
    definition: "Dealing with things sensibly and realistically in a way that is based on practical considerations.",
    options: [
      "Dealing with things sensibly and realistically in a way that is based on practical considerations.",
      "Showing a strong desire to succeed or be powerful.",
      "Extremely clean, tidy, or characterless.",
      "Easily irritated; grumpy."
    ],
    correctIndex: 0,
    example: "She took a pragmatic approach to learning English, focusing on speaking rather than memorizing complex grammar rules."
  },
  {
    word: "Resilient",
    definition: "Able to withstand or recover quickly from difficult conditions.",
    options: [
      "Extremely careful and precise.",
      "Able to withstand or recover quickly from difficult conditions.",
      "Hesitant to speak or act.",
      "Having a sweet or pleasant smell."
    ],
    correctIndex: 1,
    example: "Despite facing many speaking difficulties initially, he was resilient and eventually became fluent."
  },
  {
    word: "Meticulous",
    definition: "Showing great attention to detail; very careful and precise.",
    options: [
      "Lacking interest or excitement.",
      "Friendly, good-natured, and easy to talk to.",
      "Showing great attention to detail; very careful and precise.",
      "Having mixed feelings or contradictory ideas."
    ],
    correctIndex: 2,
    example: "He kept a meticulous record of all the new vocabulary words he learned in his practice logs."
  },
  {
    word: "Eloquent",
    definition: "Fluent or persuasive in speaking or writing.",
    options: [
      "Difficult to find, catch, or achieve.",
      "Lacking physical strength or vigor.",
      "Extremely loud and disturbing.",
      "Fluent or persuasive in speaking or writing."
    ],
    correctIndex: 3,
    example: "With enough practice in these conversational circles, you will become an eloquent English speaker."
  },
  {
    word: "Acquiesce",
    definition: "Accept something reluctantly but without protest.",
    options: [
      "Accept something reluctantly but without protest.",
      "To completely destroy or eliminate.",
      "To explain or make something clear.",
      "To increase in size or volume."
    ],
    correctIndex: 0,
    example: "While he preferred voice calls, he decided to acquiesce to his partner's request for a video session."
  }
];

export default function DailyVocabularyQuiz() {
  const [questions, setQuestions] = useState(FALLBACK_QUIZ);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Game states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [historyAnswers, setHistoryAnswers] = useState([]); // array of bools tracking correctness

  // Fetch dynamic vocabulary quiz from Gemini API
  const fetchGeminiVocabulary = async () => {
    setLoading(true);
    setIsAnswered(false);
    setSelectedOption(null);
    setCurrentIndex(0);
    setScore(0);
    setQuizFinished(false);
    setHistoryAnswers([]);

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Offline fallback
      setTimeout(() => {
        // Shuffle the fallback list slightly for freshness
        const shuffled = [...FALLBACK_QUIZ].sort(() => 0.5 - Math.random());
        setQuestions(shuffled);
        setIsLive(false);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const prompt = `Generate exactly 5 unique, intermediate-to-advanced English vocabulary words suitable for ESL learners. Choose interesting and practical words.
      For each word, provide:
      1. The word itself (capitalized).
      2. A clear, concise dictionary definition.
      3. A list of 4 distinct, plausible multiple-choice options for the definition (one option must be the exact correct definition, the other three must be realistic incorrect distractors).
      4. The 0-based index of the correct definition option in that array.
      5. A simple, short illustrative sentence demonstrating how to use the word in context.

      Return a JSON array containing exactly 5 objects matching this schema:
      [
        {
          "word": "The word",
          "definition": "The correct definition",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": 2,
          "example": "An example sentence using the word."
        }
      ]
      Do not wrap the JSON response in any markdown code blocks (like \`\`\`json). Return raw JSON only.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.95
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to contact Gemini API");
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (rawText) {
        const parsedQuestions = JSON.parse(rawText.trim());
        if (Array.isArray(parsedQuestions) && parsedQuestions.length === 5) {
          // Double check schema compatibility
          const validated = parsedQuestions.map((q) => ({
            word: q.word || "Unknown Word",
            definition: q.definition || "No definition provided.",
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option 1", "Option 2", "Option 3", "Option 4"],
            correctIndex: typeof q.correctIndex === "number" && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
            example: q.example || "An example sentence."
          }));
          setQuestions(validated);
          setIsLive(true);
        } else {
          throw new Error("Invalid structure returned");
        }
      } else {
        throw new Error("Empty response from Gemini");
      }
    } catch (error) {
      console.error("Error fetching Gemini vocabulary quiz, falling back:", error);
      // Fallback gracefully to shuffled preset list
      const shuffled = [...FALLBACK_QUIZ].sort(() => 0.5 - Math.random());
      setQuestions(shuffled);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    // Shuffle preset questions initially
    const shuffled = [...FALLBACK_QUIZ].sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
  }, []);

  const currentQuestion = questions[currentIndex] || questions[0];

  const handleOptionSelect = (optionIndex) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null || isAnswered) return;

    const isCorrect = selectedOption === currentQuestion.correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setHistoryAnswers((prev) => [...prev, isCorrect]);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
    }
  };

  // Score description helper
  const getScoreSummary = () => {
    const pct = (score / questions.length) * 100;
    if (pct === 100) return { title: "🏆 Word Master!", desc: "Flawless score! Your command of English vocabulary is truly outstanding!" };
    if (pct >= 80) return { title: "🌟 Outstanding!", desc: "Incredible vocabulary skills! You easily parsed these challenging terms." };
    if (pct >= 60) return { title: "👍 Great Effort!", desc: "Well done! Practicing daily will polish your comprehension and speaking." };
    return { title: "📖 Keep Practicing!", desc: "Excellent learning opportunity! Expanding your word bank will boost your circle discussions." };
  };

  const styles = {
    card: {
      backgroundColor: "#1e293b",
      border: "1px solid #334155",
      borderRadius: "24px",
      padding: "24px",
      boxSizing: "border-box",
      width: "100%",
      color: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px"
    },
    title: {
      fontSize: "14px",
      fontWeight: "800",
      letterSpacing: "1px",
      textTransform: "uppercase",
      color: "#38bdf8",
      margin: 0,
      display: "flex",
      alignItems: "center",
      gap: "6px"
    },
    liveBadge: {
      backgroundColor: "rgba(56, 189, 248, 0.15)",
      color: "#38bdf8",
      fontSize: "10px",
      fontWeight: "700",
      padding: "2px 8px",
      borderRadius: "6px",
      textTransform: "uppercase"
    },
    offlineBadge: {
      backgroundColor: "rgba(148, 163, 184, 0.1)",
      color: "#94a3b8",
      fontSize: "10px",
      fontWeight: "700",
      padding: "2px 8px",
      borderRadius: "6px",
      textTransform: "uppercase"
    },
    quizProgress: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "14px",
      fontWeight: "600"
    },
    progressBar: {
      width: "100%",
      height: "6px",
      backgroundColor: "#0f172a",
      borderRadius: "3px",
      marginBottom: "20px",
      overflow: "hidden"
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#38bdf8",
      borderRadius: "3px",
      transition: "width 0.3s ease"
    },
    questionWord: {
      fontSize: "22px",
      fontWeight: "900",
      color: "#ffffff",
      textAlign: "center",
      margin: "0 0 16px 0",
      letterSpacing: "-0.5px"
    },
    optionsList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      marginBottom: "20px"
    },
    optionBtn: (index, isSelected, isAnsweredState, isCorrect, isUserSelection) => {
      let bg = "#0f172a";
      let border = "1px solid #334155";
      let text = "#e2e8f0";

      if (isAnsweredState) {
        if (isCorrect) {
          bg = "rgba(16, 185, 129, 0.15)";
          border = "1.5px solid #10b981";
          text = "#34d399";
        } else if (isUserSelection) {
          bg = "rgba(239, 68, 68, 0.15)";
          border = "1.5px solid #ef4444";
          text = "#f87171";
        } else {
          bg = "#0f172a";
          border = "1px solid #1e293b";
          text = "#475569";
        }
      } else if (isSelected) {
        bg = "rgba(56, 189, 248, 0.1)";
        border = "1.5px solid #38bdf8";
        text = "#38bdf8";
      }

      return {
        backgroundColor: bg,
        border: border,
        color: text,
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "13px",
        lineHeight: "1.4",
        textAlign: "left",
        cursor: isAnsweredState ? "default" : "pointer",
        transition: "all 0.15s ease",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        fontWeight: isSelected || (isAnsweredState && isCorrect) ? "600" : "500",
        // touch targets helper
        minHeight: "48px"
      };
    },
    explanationBox: (isCorrectAnswer) => ({
      backgroundColor: isCorrectAnswer ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.05)",
      border: isCorrectAnswer ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
      borderRadius: "14px",
      padding: "14px 16px",
      marginBottom: "20px",
      textAlign: "left"
    }),
    explanationTitle: (isCorrectAnswer) => ({
      fontSize: "12px",
      fontWeight: "700",
      color: isCorrectAnswer ? "#10b981" : "#ef4444",
      margin: "0 0 6px 0",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }),
    explanationText: {
      fontSize: "12px",
      color: "#94a3b8",
      lineHeight: "1.5",
      margin: 0
    },
    submitBtn: {
      width: "100%",
      backgroundColor: "#38bdf8",
      color: "#0f172a",
      border: "none",
      borderRadius: "12px",
      padding: "12px 20px",
      fontSize: "13px",
      fontWeight: "800",
      cursor: "pointer",
      transition: "all 0.2s",
      outline: "none",
      // touch targets helper
      minHeight: "44px"
    },
    finishedCard: {
      textAlign: "center",
      padding: "10px 0"
    },
    scoreCircle: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      backgroundColor: "rgba(56, 189, 248, 0.1)",
      border: "3px solid #38bdf8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      fontWeight: "900",
      color: "#38bdf8",
      margin: "0 auto 16px auto"
    },
    summaryTitle: {
      fontSize: "18px",
      fontWeight: "800",
      color: "#ffffff",
      margin: "0 0 6px 0"
    },
    summaryDesc: {
      fontSize: "13px",
      color: "#94a3b8",
      lineHeight: "1.5",
      marginBottom: "20px"
    },
    btnRestart: {
      backgroundColor: "#38bdf8",
      color: "#0f172a",
      border: "none",
      borderRadius: "12px",
      padding: "10px 16px",
      fontSize: "12px",
      fontWeight: "800",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px"
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.card, textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🤖</div>
        <p style={{ margin: "0 0 8px 0", color: "#ffffff", fontWeight: "700" }}>Querying Gemini AI...</p>
        <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>Crafting a customized vocabulary quiz with English definitions and context examples...</p>
      </div>
    );
  }

  if (quizFinished) {
    const summary = getScoreSummary();
    return (
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <h3 style={styles.title}>📖 Daily Vocab Quiz</h3>
          <span style={isLive ? styles.liveBadge : styles.offlineBadge}>Finished</span>
        </div>

        <div style={styles.finishedCard}>
          <div style={styles.scoreCircle}>
            {score} / 5
          </div>
          <h4 style={styles.summaryTitle}>{summary.title}</h4>
          <p style={styles.summaryDesc}>{summary.desc}</p>
          
          <button
            style={styles.btnRestart}
            onClick={fetchGeminiVocabulary}
            title="Generate a fresh vocabulary quiz set"
          >
            ⚡ Fresh Live Quiz
          </button>
        </div>
      </div>
    );
  }

  const isCurrentSelectionCorrect = selectedOption === currentQuestion.correctIndex;

  return (
    <div style={styles.card} aria-label="Daily Vocabulary Quiz Section">
      <div style={styles.titleRow}>
        <h3 style={styles.title}>📖 Daily Vocab Quiz</h3>
        <span style={isLive ? styles.liveBadge : styles.offlineBadge}>
          {isLive ? "🤖 Gemini Live" : "Offline"}
        </span>
      </div>

      <div style={styles.quizProgress}>
        <span>Question {currentIndex + 1} of 5</span>
        <span>Score: {score}</span>
      </div>

      <div style={styles.progressBar}>
        <div 
          style={{ 
            ...styles.progressFill, 
            width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` 
          }} 
        />
      </div>

      <h4 style={styles.questionWord}>{currentQuestion.word}</h4>

      <div style={styles.optionsList}>
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === currentQuestion.correctIndex;
          const isUserSelection = idx === selectedOption;

          return (
            <button
              key={idx}
              type="button"
              style={styles.optionBtn(idx, isSelected, isAnswered, isCorrect, isUserSelection)}
              onClick={() => handleOptionSelect(idx)}
              disabled={isAnswered}
              title={`Option: ${option}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div style={styles.explanationBox(isCurrentSelectionCorrect)}>
          <h5 style={styles.explanationTitle(isCurrentSelectionCorrect)}>
            {isCurrentSelectionCorrect ? "✓ Correct Definition" : "❌ Incorrect Definition"}
          </h5>
          <p style={styles.explanationText}>
            <strong>Example:</strong> "{currentQuestion.example}"
          </p>
        </div>
      )}

      {!isAnswered ? (
        <button
          style={{
            ...styles.submitBtn,
            opacity: selectedOption === null ? 0.6 : 1,
            cursor: selectedOption === null ? "not-allowed" : "pointer"
          }}
          disabled={selectedOption === null}
          onClick={handleAnswerSubmit}
          title="Submit your selected choice"
        >
          Verify Answer ✓
        </button>
      ) : (
        <button
          style={styles.submitBtn}
          onClick={handleNext}
          title={currentIndex < questions.length - 1 ? "Proceed to next vocabulary word" : "Finish quiz and view summary results"}
        >
          {currentIndex < questions.length - 1 ? "Next Word ➔" : "View Results 🏁"}
        </button>
      )}
    </div>
  );
}
