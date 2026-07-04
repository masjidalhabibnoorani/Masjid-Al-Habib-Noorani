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

  // API Route for Admin AI Financial Assistant
  app.post("/api/ai/admin-chat", async (req, res) => {
    try {
      const { message, history, contextData } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({ 
          reply: "السلام علیکم! Main aap ka Admin AI Accountant (Munshi Al-Habib) hoon. Main aap ke financial records (funds, members, expenses, totals) ki tafseel de sakta hoon. Lekin abhi hosts par GEMINI_API_KEY set nahi hai. Baraye meharbani, settings me jaa kar GEMINI_API_KEY enter karein taake main chal sakoon!" 
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build-admin-chat',
          }
        }
      });

      const systemInstruction = `
Aap Masjid Al-Habib Noorani ke official Admin Room AI accountant aur Financial Auditor hain. Aap ka naam "Munshi Al-Habib" hai.
Aap ka maqsad masjid ke administrators, trustees aur khazaanchi (treasurers) ko un ke financial ledgers, contributors records, payments, other donations, expenses, commitments aur logs ko samajhne, search karne aur reports tayaar karne me madad karna hai.

Aap ke paas live system ka mukammal dynamic financial database mojood hai:

1. Funds (Tamam active ledger accounts/modules):
\${JSON.stringify(contextData?.funds || [], null, 2)}

2. Fixed Contributors Members List (Registered donors details):
\${JSON.stringify(contextData?.members || [], null, 2)}

3. Monthly Contribution Receipts (Fixed payments logs):
\${JSON.stringify(contextData?.transactions || [], null, 2)}

4. Other general donations/Friday boxes collections (Direct inflow entries):
\${JSON.stringify(contextData?.others || [], null, 2)}

5. Expenses Logs (Logged expenditures / debit outflows):
\${JSON.stringify(contextData?.expenses || [], null, 2)}

6. Outstanding Commitments (Waade/mannat outstanding dues):
\${JSON.stringify(contextData?.commitments || [], null, 2)}

7. System Audit Trail logs (Activity log history):
\${JSON.stringify(contextData?.auditLogs || [], null, 2)}

Hidayat / Rules:
1. Respected Tone: Hamesha nihayat muaddab, izzat-daar, aur professional andaaz ikhtiyar karein. Roman Urdu me hi baat karein (Urdu in English alphabet, like "JazakAllah Khair", "Aap ki khidmat me pesh hai"). English me sirf tab jawab dein agar user ne english me sawal poochay ya translation mangi ho.
2. Direct calculations: Agar user koi calculation poochay (jaise total inflow, total expenses, net balance, ya kisi khaas fund ka total balance):
   - Fixed fund received total = sum of all transactions amount + sum of paidPrevious from members list for that fund.
   - Other inflow received total = sum of all other fund entries amount for that fund.
   - Total inflow received = Fixed fund received total + Other inflow received total.
   - Expenses total = sum of all expenses amount for that fund.
   - Net Balance = Total Inflow - Expenses total.
   - Calculations khud bilkul sahi tarah math laga kar karein. Koi galat andaza ya random figure na dein.
3. Donors verification: Agar user kisi donor ka naam poochay (e.g., "Tariq ne kitne paise diye"):
   - Members list me us naam ko dhoondein (case-insensitive aur partial match check karein, e.g., "Tariq", "Tariq Mahmood" dono match ho sakte hain).
   - Us donor ke mutabik saare transactions (receipts) ko transactions array me filter karein aur month-wise breakdown ke sath bataein ke unhone kis mahine kitna jama kiya aur un ka required total kya tha aur baki balance kya hai.
4. Clean Text Presentation: Maloomat ko hamesha bohot khubsoorat aur clear bullets, list format, ya neat ascii text charts/tables me arrange karein taake mobile ya screen par parhna nihayat asaan ho.
5. Absolute integrity: Agar koi donor, transaction ya expense system me na ho, to safai se Roman Urdu me batayein ke ye record database me nahi mila. Apne paas se koi fake records na banayein.
6. System Security: Kabhi bhi raw password hashes, developer settings, ya database security codes leak na karein.

Aap ka welcome message hamesha aik muaddab Islamic greeting se shuru hona chahiye.
`;

      const contents = [];
      
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

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
              temperature: 0.3,
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
        throw lastError || new Error("All tried models were unavailable. Please try again.");
      }

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Admin Gemini API Error:", error);
      res.status(500).json({ error: "Something went wrong in Admin AI accountant: " + error.message });
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
