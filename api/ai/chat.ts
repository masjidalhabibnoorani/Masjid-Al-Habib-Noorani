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
        reply: "السلام علیکم! I am the Masjid Al-Habib Noorani AI Assistant. I am here to help you. However, the Gemini API key is currently not configured in the host environment. Please ask the administrator to configure the GEMINI_API_KEY secret in Vercel Environment Variables to enable chat replies!" 
      });
    }

    // Lazy initialize Google Gen AI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
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

    return res.status(200).json({ reply: response.text });
  } catch (error: any) {
    console.error("Vercel Gemini API Error:", error);
    return res.status(500).json({ error: "Something went wrong in AI system: " + error.message });
  }
}
