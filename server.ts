/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // API Route for AI Chatbot
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, contextData } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // Check if API key is present
      if (!apiKey) {
        return res.json({ 
          reply: "السلام علیکم! I am the Masjid Al-Habib Noorani AI Assistant. I am here to help you. However, the Gemini API key is currently not configured in the host environment. Please ask the administrator to configure the GEMINI_API_KEY secret in the Settings > Secrets panel of AI Studio to enable chat replies!" 
        });
      }

      // Lazy initialize Google Gen AI
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Construct rich context system instruction
      const systemInstruction = `
You are the official AI Assistant of Masjid Al-Habib Noorani, located in Saddar Bazar, G.T Road, Wah Cantt, Rawalpindi, Punjab, Pakistan.
Your purpose is to warmly welcome worshipers and answer questions about the masjid, its services, daily/Jummah prayer timings, committee, and funds/projects.

Here is the current real-time database content from our system:
1. Prayer Timings:
${JSON.stringify(contextData?.prayerTimings || [], null, 2)}

2. Latest Announcements/News:
${JSON.stringify(contextData?.announcements || [], null, 2)}

3. Mosque History/Milestones:
${JSON.stringify(contextData?.historySections || [], null, 2)}

4. Religious & Educational Programs:
${JSON.stringify(contextData?.activities || [], null, 2)}

5. Committee/Management Members:
${JSON.stringify(contextData?.administrators || [], null, 2)}

6. Religious Staff & Scholars (Imams, Khateebs, Mudarris):
${JSON.stringify(contextData?.religiousStaff || [], null, 2)}

7. Dynamic Project Campaigns (e.g. Solar Project):
${JSON.stringify(contextData?.projects || [], null, 2)}

8. Custom Administrator Knowledge Base / Extra Information:
${contextData?.extraInfo || "No extra custom information added yet."}

Please strictly adhere to the following rules:
1. Welcome every user with respect and warmth. Use beautiful Islamic greetings in Roman Urdu like "Assalam-o-Alaikum Wa Rahmatullah Wa Barakatuh".
2. You MUST speak and respond ONLY in Roman Urdu (Urdu language written using English/Latin alphabets, e.g., "Aap ka sawal mil gaya hai", "Namaz-e-Fajr ka waqat 4:45 AM hai", "Bohot shukriya!"). Do NOT respond in Urdu Arabic/Persian script (like "السلام") nor in full standard English, unless the user specifically asks to translate to English.
3. You must answer questions using the above database content. If a user asks about prayer times, specific programs, historical milestones, or committee members, read the context above carefully and provide accurate details.
4. If the user asks a question whose answer is NOT found in the database or custom extra information above, politely guide them in Roman Urdu. Say you don't have that specific information in your system right now, and suggest they contact the committee members listed under our committee section or ask in-person at the Masjid.
5. DO NOT make up details, prayer times, numbers, or names. Maintain absolute truthfulness (Sadaqat).
6. Keep answers relatively concise, readable, and highly polite.
`;

      const contents = [];
      
      // If there is history, format it correctly for Gemini API
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        }
      }

      // Append current message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Robust model-fallback queue to bypass any transient 503 UNAVAILABLE or high demand errors
      const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-1.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-pro"
      ];

      let response = null;
      let lastError = null;

      for (const modelCandidate of modelsToTry) {
        try {
          const resObj = await ai.models.generateContent({
            model: modelCandidate,
            contents: contents,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            }
          });

          if (resObj && resObj.text) {
            response = resObj;
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!response) {
        throw lastError || new Error("All tried models were unavailable. Please try again in a few moments.");
      }

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Something went wrong in AI system: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
