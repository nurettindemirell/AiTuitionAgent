require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const BASE =
  "https://university-tuition-api-bshybmgff4e6guem.polandcentral-01.azurewebsites.net";

const menu = () =>
  "How can I help?\n1) check tuition\n2) pay tuition\n3) unpaid tuition\n(Type: check / pay / unpaid)";

let session = { intent: null, studentNo: null, term: null, amount: null };
const reset = () => (session = { intent: null, studentNo: null, term: null, amount: null });

async function getToken() {
  const r = await axios.post(`${BASE}/api/v1/auth/login`, {
    username: "admin",
    password: "password",
  });

  const token = typeof r.data === "string" ? r.data : r.data?.token;
  if (!token) throw new Error("Token missing from login response.");
  return token;
}

/*
function normStudentNo(x) {
  const s = String(x ?? "").trim();
  return /^\d{5,}$/.test(s) ? s : null;
}
  */

function normStudentNo(x) {
  const s = String(x ?? "").trim();
  return /^\d{1,}$/.test(s) ? s : null; // 1+ digits (>= 10)
}


function normTerm(x) {
  const s = String(x ?? "").trim().toUpperCase();
  const m = s.match(/\b(FALL|SPRING|SUMMER)\s*[- ]?\s*(\d{4})\b/);
  return m ? `${m[1]}-${m[2]}` : null;
}
function normAmount(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// eksikleri sor (varsa ama direkt de doldurabilir)
function askMissing(intent, s) {
  if (intent === "QUERY_TUITION") {
    if (!s.studentNo) return "Can i take your student number?";
  }
  if (intent === "PAY_TUITION") {
    if (!s.studentNo) return "What is your student number?";
    if (!s.term) return "Term? (e.g., FALL-2026 or SPRING-2026)";
    if (!s.amount) return "Amount? (number only)";
  }
  if (intent === "UNPAID_TUITION") {
    if (!s.term) return "Term? (e.g., FALL-2026 or SPRING-2026)";
  }
  return null;
}

//AI ile route 
async function routeWithAI(text, sessionNow) {
  const system = `
You are a router for a tuition assistant.
Return ONLY JSON.

Intents: QUERY_TUITION, PAY_TUITION, UNPAID_TUITION, MENU

If user wants to cancel/reset or says "no", set reset=true and intent=MENU.
Extract:
- studentNo: 6 digits
- term: FALL-YYYY / SPRING-YYYY / SUMMER-YYYY
- amount: positive number (do NOT treat term year as amount)

Output JSON:
{"intent":"...", "studentNo":null|string, "term":null|string, "amount":null|number, "reset":boolean}
`.trim();

  const user = JSON.stringify({ message: text, session: sessionNow });

  //?
  const c = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 140,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  let obj = {};
  try {
    obj = JSON.parse(c.choices?.[0]?.message?.content || "{}");
  } catch {}

  const intent = ["QUERY_TUITION", "PAY_TUITION", "UNPAID_TUITION", "MENU"].includes(obj.intent)
    ? obj.intent
    : "MENU";

  return {
    intent,
    studentNo: normStudentNo(obj.studentNo),
    term: normTerm(obj.term),
    amount: normAmount(obj.amount),
    reset: !!obj.reset,
  };
}

app.get("/health", (req, res) => res.json({ status: "ok" }));


//Routes burada başlar
app.post("/gateway", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.json({ message: menu() });

    // quick reset without AI
    if (/^(no|n|nah|cancel|reset|restart)$/i.test(text)) {
      reset();
      return res.json({ message: menu() });
    }

    const ai = await routeWithAI(text, session);

    if (ai.reset || ai.intent === "MENU") {
      reset();
      return res.json({ message: menu() });
    }

    // if intent changed, start clean
    if (session.intent && session.intent !== ai.intent) reset();

    session.intent = ai.intent;
    if (ai.studentNo) session.studentNo = ai.studentNo;
    if (ai.term) session.term = ai.term;
    if (ai.amount) session.amount = ai.amount;

    // deterministic missing question
    const missingQ = askMissing(session.intent, session);
    if (missingQ) return res.json({ message: missingQ });

    //QUERY KISMI 
    if (session.intent === "QUERY_TUITION") {
      const token = await getToken();
      const r = await axios.get(`${BASE}/api/v1/banking/tuition`, {
        params: { studentNo: session.studentNo },
        headers: { Authorization: `Bearer ${token}` },
      });

      const msg = `StudentNo ${session.studentNo} | Total: ${r.data.tuitionTotal} | Balance: ${r.data.balance}\nAnything else?`;
      reset();
      return res.json({ message: msg });
    }
    //PAYING TUITION KISMI 
    if (session.intent === "PAY_TUITION") {
      const token = await getToken();
      const r = await axios.post(
        `${BASE}/api/v1/banking/pay`,
        { studentNo: session.studentNo, term: session.term, amount: session.amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const msg = `${r.data?.message || "Payment processed."}\nAnything else?`;
      reset();
      return res.json({ message: msg });
    }
    //UNPAID TUITION KISMI 
    if (session.intent === "UNPAID_TUITION") {
      const token = await getToken();
      const r = await axios.get(`${BASE}/api/v1/admin/tuition/unpaid`, {
        params: { term: session.term },
        headers: { Authorization: `Bearer ${token}` },
      });

      // listeyi karışıklık olduğu için AI a göndermiyor
      const items = r.data?.items || [];
      const list = items.length
        ? items.map(i => `Student No: ${i.studentNo} | Tuition: ${i.balance}`).join("\n")
        : "There are no students in tuition for this term.";

      const msg = `📌 ${session.term} unpaid list:\n${list}\n\nAnything else?`;
      reset();
      return res.json({ message: msg });
    }

    
    reset();
    return res.json({ message: menu() });
  } catch (err) {
    reset();
    const details = err.response?.data || err.message;
    return res.status(500).json({
      message: `Something went wrong.\n${typeof details === "string" ? details : JSON.stringify(details)}`,
    });
  }
});

app.listen(3001, () => console.log("Backend running on http://localhost:3001"));
