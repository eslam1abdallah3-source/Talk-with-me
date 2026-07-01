import { db } from "../firebase/firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

/**
 * Service for interacting with the Gemini API to provide English Coaching features.
 */

const getApiKey = () => {
  return process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
};

/**
 * Analyzes an English sentence to provide grammar correction, suggestions, and level scoring.
 * @param {string} text - The user's input message.
 * @returns {Promise<Object|null>} The structured coaching feedback, or null on error/no API key.
 */
export const getAICoachingFeedback = async (text) => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !text.trim()) {
    console.warn("Gemini API key is not configured or text is empty.");
    return null;
  }

  const prompt = `You are an expert ESL (English as a Second Language) tutor.
Analyze the following user-submitted message:
"${text}"

Provide grammar correction, improvement suggestions, explanations, and evaluate the English proficiency level (A1 to C2 framework). Also, provide 2 short, conversational, context-aware auto-reply suggestions that a partner could use to reply to this message.

Return a JSON object matching this schema exactly:
{
  "hasErrors": true/false,
  "correction": "The corrected version of the sentence (only if hasErrors is true, otherwise empty or same sentence)",
  "explanation": "A friendly, easy-to-understand 1-2 sentence explanation of any grammar rules broken, or general advice on phrasing if correct.",
  "suggestions": "An alternative, more natural or advanced way to express the same thought.",
  "level": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "autoReplies": ["Auto reply 1", "Auto reply 2"]
}

Do not include any markdown wrappers (like \`\`\`json). Return raw JSON only.`;

  try {
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
            temperature: 0.3
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const feedback = JSON.parse(candidateText.trim());
    return feedback;
  } catch (error) {
    console.error("Error fetching AI coaching feedback from Gemini:", error);
    return null;
  }
};

/**
 * Runs basic sentiment/word filtering for moderation.
 * @param {string} text - Message text to inspect.
 * @returns {boolean} True if clean, false if inappropriate.
 */
export const contentModerationCheck = (text) => {
  if (!text) return true;
  const bannedKeywords = [
    "scam", "spam", "bitch", "bastard", "idiot", "asshole", "fuck", "shit", "dick", "pussy"
  ];
  const normalized = text.toLowerCase();
  return !bannedKeywords.some(keyword => normalized.includes(keyword));
};
