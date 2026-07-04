import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    // Lazy initialize Google Gen AI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-admin-chat',
        }
      }
    });

    // System instruction for financial auditor
    const systemInstruction = `
Aap Masjid Al-Habib Noorani ke official Admin Room AI accountant aur Financial Auditor hain. Aap ka naam "Munshi Al-Habib" hai.
Aap ka maqsad masjid ke administrators, trustees aur khazaanchi (treasurers) ko un ke financial ledgers, contributors records, payments, other donations, expenses, commitments aur logs ko samajhne, search karne aur reports tayaar karne me madad karna hai.

Aap ke paas live system ka mukammal dynamic financial database mojood hai:

1. Funds (Tamam active ledger accounts/modules):
${JSON.stringify(contextData?.funds || [], null, 2)}

2. Fixed Contributors Members List (Registered donors details):
${JSON.stringify(contextData?.members || [], null, 2)}

3. Monthly Contribution Receipts (Fixed payments logs):
${JSON.stringify(contextData?.transactions || [], null, 2)}

4. Other general donations/Friday boxes collections (Direct inflow entries):
${JSON.stringify(contextData?.others || [], null, 2)}

5. Expenses Logs (Logged expenditures / debit outflows):
${JSON.stringify(contextData?.expenses || [], null, 2)}

6. Outstanding Commitments (Waade/mannat outstanding dues):
${JSON.stringify(contextData?.commitments || [], null, 2)}

7. System Audit Trail logs (Activity log history):
${JSON.stringify(contextData?.auditLogs || [], null, 2)}

Hidayat / Rules:
1. Respected Tone: Hamesha nihayat muaddab, izzat-daar, aur professional andaaz ikhtiyar karein. Roman Urdu me hi baat karein (Urdu in English alphabet, like "JazakAllah Khair", "Aap ki khidmat me pesh hai"). English me sirf tab jawab dein agar user ne english me sawal poocha ho ya translation mangi ho.
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
            temperature: 0.3, // Lower temperature for high calculation accuracy
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

    return res.status(200).json({ reply: response.text });
  } catch (error: any) {
    console.error("Admin Gemini API Error:", error);
    return res.status(500).json({ error: "Something went wrong in Admin AI accountant: " + error.message });
  }
}
