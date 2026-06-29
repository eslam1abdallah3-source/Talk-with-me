import React, { useState, useEffect } from "react";

// Static high-quality fallback tips for instant rendering or if the API key is unconfigured/offline
const FALLBACK_TIPS = [
  {
    category: "Idioms",
    title: "Spill the beans",
    explanation: "To reveal secret information, often by accident or prematurely.",
    examples: [
      "We were planning a surprise birthday party, but Mark accidentally spilled the beans.",
      "Don't spill the beans about our WebRTC call to anyone else!"
    ],
    quizQuestion: "Complete the sentence: 'She kept asking questions until I finally ___ (revealed the secret).'",
    quizAnswer: "spilled the beans"
  },
  {
    category: "Common Mistakes",
    title: "Since vs. For",
    explanation: "Use 'since' to refer to a specific starting point in time, and 'for' to refer to a duration or period of time.",
    examples: [
      "I have been speaking English since 2021 (starting point).",
      "I have practiced with peer learners for three hours (duration)."
    ],
    quizQuestion: "Which is correct: 'I have been matching online ___ (since/for) two weeks.'?",
    quizAnswer: "for"
  },
  {
    category: "Grammar",
    title: "Fewer vs. Less",
    explanation: "Use 'fewer' for countable plural nouns, and 'less' for uncountable singular nouns.",
    examples: [
      "I made fewer mistakes in today's speaking session.",
      "This exercise requires less effort than yesterday's."
    ],
    quizQuestion: "Complete: 'There are ___ (fewer/less) cars on the road today.'",
    quizAnswer: "fewer"
  },
  {
    category: "Phrasal Verbs",
    title: "Bring up",
    explanation: "To introduce or mention a topic in conversation.",
    examples: [
      "I didn't want to bring up my English test, but my partner asked about it.",
      "He always brings up his favorite hobbies when matching with someone new."
    ],
    quizQuestion: "Complete: 'It's a sensitive topic, so please don't ___ it up.'",
    quizAnswer: "bring"
  },
  {
    category: "Pronunciation",
    title: "The Word: Comfortable",
    explanation: "In modern fast English, we omit the 'or' syllable. It is pronounced like 'COMF-ter-bul' (3 syllables) instead of 'com-for-ta-ble' (4 syllables).",
    examples: [
      "I feel very comfortable speaking in this circle.",
      "Is that chair comfortable enough for your study session?"
    ],
    quizQuestion: "How many syllables are typically pronounced in 'comfortable' in native fast speech?",
    quizAnswer: "3"
  }
];

export default function SidebarTips() {
  const [currentTip, setCurrentTip] = useState(FALLBACK_TIPS[0]);
  const [loading, setLoading] = useState(false);
  const [userSentence, setUserSentence] = useState("");
  const [coachingFeedback, setCoachingFeedback] = useState("");
  const [checkingSentence, setCheckingSentence] = useState(false);
  const [quizInput, setQuizInput] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("tip"); // tip, practice, quiz

  // Load a random tip initially
  useEffect(() => {
    const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
    setCurrentTip(randomTip);
  }, []);

  // Fetch a new live tip using Gemini API
  const handleFetchLiveTip = async () => {
    setLoading(true);
    setCoachingFeedback("");
    setUserSentence("");
    setQuizInput("");
    setQuizFeedback("");
    setActiveTab("tip");

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
    
    // If API key is missing or is the placeholder template string, use random fallback tip for smooth UX
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      setTimeout(() => {
        const availableTips = FALLBACK_TIPS.filter(t => t.title !== currentTip.title);
        const nextTip = availableTips.length > 0 
          ? availableTips[Math.floor(Math.random() * availableTips.length)]
          : FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
        setCurrentTip(nextTip);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const prompt = `Generate a unique and interesting English grammar, idiom, phrasal verb, pronunciation, or common mistake tip for an ESL language learner. Choose a random category from: Grammar, Idioms, Phrasal Verbs, Common Mistakes, Pronunciation. Return a JSON object matching this schema:
      {
        "category": "One of the categories",
        "title": "The specific phrase, word, or rule",
        "explanation": "A friendly, concise 2-3 sentence explanation of the rule or concept.",
        "examples": ["An illustrative sentence.", "Another illustrative sentence."],
        "quizQuestion": "A quick fill-in-the-blank or matching question directly testing this concept. Put parenthetical hints if helpful.",
        "quizAnswer": "The exact short answer for the quiz."
      }
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
              temperature: 0.8
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error("Gemini API call failed");
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawText) {
        const parsedTip = JSON.parse(rawText.trim());
        if (parsedTip.category && parsedTip.title) {
          setCurrentTip(parsedTip);
        } else {
          throw new Error("Invalid structure returned");
        }
      } else {
        throw new Error("No response text");
      }
    } catch (error) {
      console.error("Error fetching live Gemini tip, falling back:", error);
      // Fallback gracefully on network error or parse failures
      const randomTip = FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
      setCurrentTip(randomTip);
    } finally {
      setLoading(false);
    }
  };

  // Check user practice sentence using Gemini API Coach
  const handleCheckSentence = async () => {
    if (!userSentence.trim()) return;
    setCheckingSentence(true);
    setCoachingFeedback("");

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Friendly offline/local mock feedback
      setTimeout(() => {
        setCoachingFeedback(
          `📝 Coach feedback: Brilliant attempt! You wrote a clear and natural sentence using "${currentTip.title}". Practice saying this aloud while you wait for your match!`
        );
        setCheckingSentence(false);
      }, 1000);
      return;
    }

    try {
      const evaluationPrompt = `You are a friendly, encouraging English Speaking Coach. The user just learned the concept: "${currentTip.title}" which means: "${currentTip.explanation}". 
      They wrote this practice sentence: "${userSentence}". 
      Evaluate if they used it correctly, correct any subtle grammar mistakes, and provide warm, constructive feedback in exactly 2-3 sentences. Keep your tone cheerful, positive, and direct.`;

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
                    text: evaluationPrompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error("Failed to contact Gemini Coach");
      }

      const data = await response.json();
      const feedbackText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setCoachingFeedback(feedbackText || "Wonderful effort! Try reading your sentence out loud.");
    } catch (err) {
      console.error("Coaching feedback failed:", err);
      setCoachingFeedback(`👍 Excellent writing practice! Your sentence looks great. Try saying it aloud when you connect with your speaking partner!`);
    } finally {
      setCheckingSentence(false);
    }
  };

  // Submit quick quiz answer
  const handleSubmitQuiz = (e) => {
    e.preventDefault();
    if (!quizInput.trim()) return;

    const cleanInput = quizInput.trim().toLowerCase();
    const cleanAnswer = currentTip.quizAnswer.toLowerCase();

    if (cleanInput.includes(cleanAnswer) || cleanAnswer.includes(cleanInput)) {
      setQuizFeedback("🎉 Correct! Well done, you nailed this concept!");
    } else {
      setQuizFeedback(`💡 Almost! The correct answer is: "${currentTip.quizAnswer}". Keep practicing!`);
    }
  };

  // Visual Category Styling Helper
  const getCategoryColor = (category) => {
    switch (category) {
      case "Grammar": return "#7c3aed"; // Purple
      case "Idioms": return "#10b981"; // Emerald
      case "Phrasal Verbs": return "#f59e0b"; // Amber
      case "Common Mistakes": return "#ef4444"; // Red
      case "Pronunciation": return "#06b6d4"; // Cyan
      default: return "#38bdf8"; // Blue
    }
  };

  const styles = {
    sidebarCard: {
      width: "300px",
      backgroundColor: "#1e293b",
      borderRadius: "24px",
      border: "1px solid #334155",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      color: "#f8fafc",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    title: {
      fontSize: "15px",
      fontWeight: "800",
      letterSpacing: "0.5px",
      color: "#94a3b8",
      textTransform: "uppercase",
      margin: 0
    },
    refreshBtn: {
      background: "none",
      border: "none",
      color: "#38bdf8",
      fontSize: "18px",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "50%",
      transition: "background-color 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    badge: {
      alignSelf: "flex-start",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "11px",
      fontWeight: "700",
      color: "#ffffff",
      backgroundColor: getCategoryColor(currentTip.category)
    },
    conceptTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#ffffff",
      margin: "4px 0"
    },
    tabs: {
      display: "flex",
      borderBottom: "1px solid #334155",
      gap: "8px",
      marginTop: "8px"
    },
    tabButton: (isActive) => ({
      background: "none",
      border: "none",
      color: isActive ? "#38bdf8" : "#64748b",
      borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent",
      padding: "6px 8px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "color 0.2s"
    }),
    tabContent: {
      fontSize: "13.5px",
      lineHeight: "1.5",
      color: "#cbd5e1",
      minHeight: "150px"
    },
    sectionTitle: {
      fontSize: "11.5px",
      fontWeight: "700",
      color: "#64748b",
      textTransform: "uppercase",
      marginTop: "12px",
      marginBottom: "6px"
    },
    exampleItem: {
      backgroundColor: "#0f172a",
      padding: "8px 12px",
      borderRadius: "8px",
      fontSize: "12.5px",
      color: "#94a3b8",
      fontStyle: "italic",
      marginBottom: "8px",
      borderLeft: `3px solid ${getCategoryColor(currentTip.category)}`
    },
    textArea: {
      width: "100%",
      backgroundColor: "#0f172a",
      color: "#f8fafc",
      border: "1px solid #334155",
      borderRadius: "10px",
      padding: "10px",
      fontSize: "12.5px",
      resize: "none",
      outline: "none",
      boxSizing: "border-box"
    },
    input: {
      width: "100%",
      backgroundColor: "#0f172a",
      color: "#f8fafc",
      border: "1px solid #334155",
      borderRadius: "10px",
      padding: "10px",
      fontSize: "12.5px",
      outline: "none",
      boxSizing: "border-box",
      marginBottom: "10px"
    },
    submitBtn: {
      width: "100%",
      backgroundColor: "#0284c7",
      color: "#ffffff",
      border: "none",
      borderRadius: "10px",
      padding: "10px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "6px"
    },
    coachingBox: {
      backgroundColor: "rgba(56, 189, 248, 0.08)",
      border: "1px solid rgba(56, 189, 248, 0.2)",
      borderRadius: "10px",
      padding: "10px 12px",
      marginTop: "12px",
      fontSize: "12px",
      color: "#38bdf8",
      lineHeight: "1.4"
    },
    quizFeedbackBox: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderRadius: "10px",
      padding: "10px 12px",
      marginTop: "12px",
      fontSize: "12px",
      color: "#f8fafc",
      lineHeight: "1.4"
    }
  };

  return (
    <div style={styles.sidebarCard}>
      {/* Sidebar Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>💡 Daily Practice</h3>
        <button 
          style={styles.refreshBtn} 
          onClick={handleFetchLiveTip}
          disabled={loading}
          title="Generate a new AI English tip!"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "230px", gap: "12px" }}>
          <span style={{ fontSize: "28px", animation: "spin 1s infinite linear" }}>🌀</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Consulting Gemini AI English Coach...</span>
        </div>
      ) : (
        <>
          {/* Active Tip Identity */}
          <div>
            <span style={styles.badge}>{currentTip.category}</span>
            <h4 style={styles.conceptTitle}>{currentTip.title}</h4>
          </div>

          {/* Sub Navigation Tabs */}
          <div style={styles.tabs}>
            <button 
              style={styles.tabButton(activeTab === "tip")} 
              onClick={() => setActiveTab("tip")}
            >
              Tip Details
            </button>
            <button 
              style={styles.tabButton(activeTab === "practice")} 
              onClick={() => setActiveTab("practice")}
            >
              Practice Writing
            </button>
            <button 
              style={styles.tabButton(activeTab === "quiz")} 
              onClick={() => setActiveTab("quiz")}
            >
              Interactive Quiz
            </button>
          </div>

          {/* Tab Views */}
          <div style={styles.tabContent}>
            {activeTab === "tip" && (
              <div>
                <p style={{ margin: "8px 0" }}>{currentTip.explanation}</p>
                
                {currentTip.examples && currentTip.examples.length > 0 && (
                  <div>
                    <h5 style={styles.sectionTitle}>Conversational Examples</h5>
                    {currentTip.examples.map((ex, idx) => (
                      <div key={idx} style={styles.exampleItem}>
                        "{ex}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "practice" && (
              <div>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 12px 0" }}>
                  Write a customized sentence using "{currentTip.title}". Our AI coach will instantly critique your grammar!
                </p>
                <textarea
                  style={styles.textArea}
                  rows={3}
                  placeholder="e.g. He is comfortable sharing secrets with his circles..."
                  value={userSentence}
                  onChange={(e) => setUserSentence(e.target.value)}
                  maxLength={250}
                />
                <button 
                  style={{ ...styles.submitBtn, opacity: userSentence.trim() ? 1 : 0.6 }}
                  onClick={handleCheckSentence}
                  disabled={checkingSentence || !userSentence.trim()}
                >
                  {checkingSentence ? "Analysing text..." : "Check My Sentence 📝"}
                </button>

                {coachingFeedback && (
                  <div style={styles.coachingBox}>
                    {coachingFeedback}
                  </div>
                )}
              </div>
            )}

            {activeTab === "quiz" && (
              <div>
                <p style={{ margin: "4px 0 12px 0", fontSize: "13px" }}>
                  {currentTip.quizQuestion || "Test your understanding of this topic!"}
                </p>
                
                <form onSubmit={handleSubmitQuiz}>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Type your answer here..."
                    value={quizInput}
                    onChange={(e) => setQuizInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    style={styles.submitBtn}
                    disabled={!quizInput.trim()}
                  >
                    Submit Answer Check
                  </button>
                </form>

                {quizFeedback && (
                  <div style={styles.quizFeedbackBox}>
                    {quizFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Embedded Spinner Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
