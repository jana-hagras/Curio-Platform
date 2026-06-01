import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FiMessageSquare, FiX, FiSend, FiCpu, FiUser } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import "./FloatingChatbot.css";

export default function FloatingChatbot() {
  const { user, isBuyer, isArtisan, isAdmin } = useAuth();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  // Set initial welcome message based on role and language
  useEffect(() => {
    let welcome = "";
    if (isAr) {
      if (isAdmin) welcome = "أهلاً بك يا مدير النظام! كيف يمكنني مساعدتك في استعراض إحصائيات منصة كيريو اليوم؟";
      else if (isArtisan) welcome = "أهلاً بك يا فناننا المبدع! كيف يمكنني مساعدتك في مبيعاتك، أرباحك، أو إدارة منتجاتك اليوم؟";
      else if (isBuyer) welcome = "أهلاً بك! كيف يمكنني مساعدتك في تتبع طلباتك، طلبات التصميم ثلاثية الأبعاد الخاصة بك، أو ورش العمل اليوم؟";
      else welcome = "أهلاً بك في منصة كيريو للتحف والمنتجات التراثية المصرية! كيف يمكنني مساعدتك اليوم؟";
    } else {
      if (isAdmin) welcome = "Welcome, System Administrator! How can I assist you with platform analytics or statistics today?";
      else if (isArtisan) welcome = "Welcome, Artisan! How can I assist you with your sales, earnings, or product dashboard today?";
      else if (isBuyer) welcome = "Welcome to Curio! How can I assist you with your orders, custom 3D requests, or workshops today?";
      else welcome = "Welcome to Curio, Egypt's premier artisan handcrafts marketplace! How can I help you today?";
    }

    setMessages([
      {
        id: "welcome",
        text: welcome,
        sender: "bot",
        time: new Date(),
      },
    ]);
  }, [user, isAr, isAdmin, isArtisan, isBuyer]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Determine suggestions list based on role
  const getSuggestions = () => {
    if (isAdmin) {
      return isAr
        ? ["عرض إحصائيات المنصة العامة", "عدد المستخدمين المسجلين", "حالة حسابات الضمان"]
        : ["Show platform statistics", "How many users registered?", "Escrow account status"];
    }
    if (isArtisan) {
      return isAr
        ? ["عرض أرباحي ومبيعاتي", "عدد منتجاتي النشطة", "قيمة عمولة المنصة", "ورش العمل الخاصة بي"]
        : ["Show my earnings", "My products count", "Platform commission fee", "My workshops"];
    }
    if (isBuyer) {
      return isAr
        ? ["حالة طلبي الأخير", "عرض طلباتي المخصصة", "كيف أطلب تصميماً ثلاثي الأبعاد؟", "قيمة عمولة المنصة"]
        : ["My latest order status", "View my requests", "How to create a custom request?", "Platform commission fee"];
    }
    return isAr
      ? ["كيف أسجل كحرفي؟", "ما هو نظام الضمان (Escrow)؟", "كيف أطلب تصميم ثلاثي الأبعاد؟", "قيمة عمولة المنصة"]
      : ["How to register as an artisan?", "What is Escrow?", "How to make a custom request?", "Platform fee"];
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Clear input
    setInput("");

    // Append user message
    const userMsg = {
      id: Date.now().toString(),
      text: query,
      sender: "user",
      time: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post("/assistant/chat", { message: query });
      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: res.reply || (isAr ? "لم أستطع معالجة الرد." : "Could not process response."),
        sender: "bot",
        time: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: isAr
          ? "عذراً، أواجه مشكلة مؤقتة في خوادم الذكاء الاصطناعي."
          : "Sorry, I am experiencing temporary AI service issues.",
        sender: "bot",
        time: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className={`chatbot-container ${isAr ? "rtl" : ""}`}>
      {/* Collapsed Button */}
      {!isOpen && (
        <button type="button" className="chatbot-launcher" onClick={() => setIsOpen(true)}>
          <span className="chatbot-launcher-ping" />
          <FiMessageSquare className="chatbot-launcher-icon" />
          <span className="chatbot-launcher-tooltip">
            {isAr ? "اسأل كيريو AI" : "Ask Curio AI"}
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <FiCpu />
              </div>
              <div>
                <h4 className="chatbot-title">Curio AI</h4>
                <div className="chatbot-status">
                  <span className="chatbot-status-dot" />
                  <span>{isAr ? "متصل" : "Online"}</span>
                </div>
              </div>
            </div>
            <button type="button" className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <FiX />
            </button>
          </div>

          {/* Body */}
          <div className="chatbot-body">
            <div className="chatbot-messages">
              {messages.map((m) => (
                <div key={m.id} className={`chatbot-message ${m.sender}`}>
                  <div className="chatbot-message-bubble">
                    <p className="chatbot-message-text">{m.text}</p>
                    <span className="chatbot-message-time">
                      {m.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chatbot-message bot typing">
                  <div className="chatbot-message-bubble">
                    <div className="typing-dots">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Footer & input */}
          <div className="chatbot-footer">
            {/* Suggestions */}
            <div className="chatbot-suggestions-wrapper">
              <div className="chatbot-suggestions">
                {getSuggestions().map((s) => (
                  <button
                    type="button"
                    key={s}
                    className="chatbot-suggestion-chip"
                    onClick={() => handleSend(s)}
                    disabled={loading}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="chatbot-input-bar">
              <input
                type="text"
                className="chatbot-input-field"
                placeholder={isAr ? "اكتب رسالتك..." : "Ask me anything..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
              />
              <button
                type="button"
                className="chatbot-send-btn"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
