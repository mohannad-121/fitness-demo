import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const ChatbotPage = () => {
  const { language } = useLanguage();
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const loadWelcome = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/chat/welcome?language=${language === "ar" ? "ar" : "en"}`
        );
        if (!response.ok) {
          throw new Error("Welcome request failed");
        }
        const data = await response.json();
        if (data.reply) {
          setChatMessages([{ role: "assistant", content: data.reply }]);
        } else {
          setChatMessages([
            {
              role: "assistant",
              content: language === "ar" ? "ما لقيت رد مناسب حالياً." : "I couldn't find a suitable reply right now."
            }
          ]);
        }
      } catch (error) {
        setChatMessages([
          {
            role: "assistant",
            content: language === "ar"
              ? "ما قدرت اتصل بالخادم. شغّل الباكند على المنفذ 8000 ثم جرّب مرة ثانية."
              : "I can't reach the backend. Start the API on port 8000 and try again."
          }
        ]);
      }
    };

    loadWelcome();
  }, [language]);

  const handleSendChat = async () => {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language: language === "ar" ? "ar" : "en" })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: language === "ar" ? "ما لقيت رد مناسب حالياً." : "I couldn't find a suitable reply right now."
          }
        ]);
      }
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: language === "ar"
            ? "صار خطأ بالاتصال بالخادم. تأكد أن الباكند شغال على 8000."
            : "There was a connection error to the backend. Make sure the API is running on port 8000."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen pb-24 md:pb-8", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "container mx-auto px-4 pt-24", children: /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        className: "glass-card rounded-2xl p-4 md:p-6 max-w-4xl mx-auto",
        children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl md:text-4xl text-foreground mb-3", children: language === "ar" ? "الشات بوت" : "Chatbot" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: language === "ar" ? "اسأل عن التمارين، التغذية، والتقدم." : "Ask about workouts, nutrition, and progress." }),
          /* @__PURE__ */ jsx("div", { className: "h-[420px] overflow-y-auto space-y-3 mb-4 pr-1", children: chatMessages.map((m, idx) => /* @__PURE__ */ jsx(
            "div",
            {
              className: `max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"}`,
              children: m.content
            },
            idx
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                value: chatInput,
                onChange: (e) => setChatInput(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendChat();
                  }
                },
                placeholder: language === "ar" ? "اكتب سؤالك الرياضي..." : "Type your fitness question...",
                className: "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              }
            ),
            /* @__PURE__ */ jsx(Button, { onClick: handleSendChat, disabled: chatLoading, children: chatLoading ? (language === "ar" ? "جاري الإرسال..." : "Sending...") : (language === "ar" ? "إرسال" : "Send") })
          ] })
        ] })
      }
    ) })
  ] });
};

var stdin_default = ChatbotPage;
export {
  stdin_default as default
};
