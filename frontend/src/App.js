import React, { useEffect, useRef, useState } from "react";

function normalizeAgentText(data) {
  // Backend bazen {message:"..."} döndürüyor, bazen {error, details}
  if (!data) return "No response.";
  if (typeof data === "string") return data;

  if (data.message) return String(data.message);

  if (data.error) {
    const details =
      typeof data.details === "string"
        ? data.details
        : data.details
        ? JSON.stringify(data.details)
        : "";
    return details ? `❌ ${data.error}\n${details}` : `❌ ${data.error}`;
  }

  // fallback
  return JSON.stringify(data, null, 2);
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text:
        "Hi! How can I help you today?\n- Check tuition\n- Pay tuition\n- Show unpaid tuition",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { role: "user", text, time: now }]);
    setInput("");
    setIsTyping(true);

    //Gateway e gidiyoruz
    try {
      const resp = await fetch("/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const data = await resp.json();
      const agentText = normalizeAgentText(data);
      const t2 = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setMessages((prev) => [...prev, { role: "agent", text: agentText, time: t2 }]);
    } catch (e) {
      const t2 = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: "❌ Backend error (connection failed).", time: t2 }
      ]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.title}>AI Tuition Agent</div>
          <div style={styles.sub}>Type naturally: “pay tuition”, “check my tuition”, “show unpaid tuition for fall 2026”</div>
        </div>

        <div ref={listRef} style={styles.chatArea}>
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                style={{
                  ...styles.row,
                  justifyContent: isUser ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(isUser ? styles.userBubble : styles.agentBubble)
                  }}
                >
                  <div style={styles.text}>{m.text}</div>
                  <div style={styles.time}>{m.time}</div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ ...styles.row, justifyContent: "flex-start" }}>
              <div style={{ ...styles.bubble, ...styles.agentBubble }}>
                <div style={styles.typing}>Typing…</div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.inputBar}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message…"
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.btn}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

//
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f6f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    fontFamily: "Arial"
  },
  card: {
    width: "min(820px, 95vw)",
    height: "min(720px, 90vh)",
    background: "white",
    borderRadius: 14,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e7e7e7"
  },
  header: {
    padding: "14px 16px",
    borderBottom: "1px solid #eee"
  },
  title: { fontSize: 20, fontWeight: 700 },
  sub: { marginTop: 6, fontSize: 12, color: "#666" },

  chatArea: {
    flex: 1,
    padding: 14,
    overflowY: "auto",
    background: "#d8d8d8ff"
  },
  row: {
    display: "flex",
    marginBottom: 10
  },
  bubble: {
    maxWidth: "72%",
    borderRadius: 16,
    padding: "10px 12px",
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  userBubble: {
    background: "#2f6fed",
    color: "white",
    borderBottomRightRadius: 6
  },
  agentBubble: {
    background: "#e9ecef",
    color: "#111",
    borderBottomLeftRadius: 6
  },
  text: { fontSize: 14 },
  time: {
    marginTop: 6,
    fontSize: 11,
    opacity: 0.75,
    textAlign: "right"
  },
  typing: { fontSize: 13, opacity: 0.8 },

  inputBar: {
    display: "flex",
    gap: 10,
    padding: 12,
    borderTop: "1px solid #eee",
    background: "white"
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 14
  },
  btn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#111",
    color: "white",
    fontWeight: 600
  }
};
