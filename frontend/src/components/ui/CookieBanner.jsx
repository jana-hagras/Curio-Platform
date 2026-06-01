import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiChevronUp, FiCheck, FiSettings } from "react-icons/fi";
import "./CookieBanner.css";

export default function CookieBanner() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  // Cookie states
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true
    functional: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem("curio-cookie-consent");
    if (!savedConsent) {
      // Delay showing banner slightly for smooth entering animation
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem("curio-cookie-consent", JSON.stringify(allPreferences));
    setVisible(false);
  };

  const handleRejectAll = () => {
    const essentialPreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem("curio-cookie-consent", JSON.stringify(essentialPreferences));
    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("curio-cookie-consent", JSON.stringify(preferences));
    setVisible(false);
  };

  const togglePreference = (key) => {
    if (key === "necessary") return;
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!visible) return null;

  return (
    <div className={`cookie-banner-wrapper ${isAr ? "rtl" : ""}`} dir={isAr ? "rtl" : "ltr"}>
      <div className="cookie-banner-content">
        <div className="cookie-banner-main">
          <div className="cookie-banner-text-section">
            <h4 className="cookie-banner-title">
              {isAr ? "إعدادات ملفات تعريف الارتباط والخصوصية" : "Cookie & Privacy Preferences"}
            </h4>
            <p className="cookie-banner-desc">
              {isAr ? (
                <>
                  نحن نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وتوفير المعاينات ثلاثية الأبعاد المدعومة بالذكاء الاصطناعي. يمكنك قراءة التفاصيل في{" "}
                  <Link to="/cookie-policy" className="cookie-banner-link">سياسة ملفات الارتباط</Link> و{" "}
                  <Link to="/privacy-policy" className="cookie-banner-link">سياسة الخصوصية</Link>.
                </>
              ) : (
                <>
                  We use cookies to optimize navigation, customize features, and enable Gemini AI-driven custom previews. Learn more in our{" "}
                  <Link to="/cookie-policy" className="cookie-banner-link">Cookie Policy</Link> and{" "}
                  <Link to="/privacy-policy" className="cookie-banner-link">Privacy Policy</Link>.
                </>
              )}
            </p>
          </div>
          <div className="cookie-banner-actions">
            <button type="button" className="cookie-btn cookie-btn-settings" onClick={() => setShowPreferences(!showPreferences)}>
              <FiSettings /> {isAr ? "تخصيص الخيارات" : "Customize"}
            </button>
            <button type="button" className="cookie-btn cookie-btn-secondary" onClick={handleRejectAll}>
              {isAr ? "رفض غير الضرورية" : "Reject All"}
            </button>
            <button type="button" className="cookie-btn cookie-btn-primary" onClick={handleAcceptAll}>
              <FiCheck /> {isAr ? "قبول الكل" : "Accept All"}
            </button>
          </div>
        </div>

        {showPreferences && (
          <div className="cookie-banner-preferences-drawer">
            <hr className="cookie-banner-divider" />
            <div className="cookie-prefs-grid">
              
              {/* Necessary */}
              <div className="cookie-pref-item disabled">
                <div className="cookie-pref-info">
                  <span className="cookie-pref-title">
                    {isAr ? "ملفات الارتباط الضرورية" : "Necessary Cookies"}
                    <span className="cookie-badge essential">{isAr ? "إلزامي" : "Required"}</span>
                  </span>
                  <span className="cookie-pref-desc">
                    {isAr ? "مطلوبة لتسجيل الدخول والوظائف الأساسية." : "Essential for logging in and secure transactions."}
                  </span>
                </div>
                <div className="cookie-toggle active">
                  <div className="cookie-toggle-slider" />
                </div>
              </div>

              {/* Functional */}
              <div className="cookie-pref-item" onClick={() => togglePreference("functional")}>
                <div className="cookie-pref-info">
                  <span className="cookie-pref-title">
                    {isAr ? "ملفات الارتباط الوظيفية" : "Functional Cookies"}
                  </span>
                  <span className="cookie-pref-desc">
                    {isAr ? "لتذكر تفضيلاتك مثل المظهر الداكن واللغة." : "Remembers choices like theme colors and preferred language."}
                  </span>
                </div>
                <div className={`cookie-toggle ${preferences.functional ? "active" : ""}`}>
                  <div className="cookie-toggle-slider" />
                </div>
              </div>

              {/* Analytics */}
              <div className="cookie-pref-item" onClick={() => togglePreference("analytics")}>
                <div className="cookie-pref-info">
                  <span className="cookie-pref-title">
                    {isAr ? "ملفات الارتباط التحليلية" : "Analytics Cookies"}
                  </span>
                  <span className="cookie-pref-desc">
                    {isAr ? "تساعدنا على قياس وتحسين أداء المنصة." : "Helps measure traffic volume and improve performance."}
                  </span>
                </div>
                <div className={`cookie-toggle ${preferences.analytics ? "active" : ""}`}>
                  <div className="cookie-toggle-slider" />
                </div>
              </div>

              {/* Marketing */}
              <div className="cookie-pref-item" onClick={() => togglePreference("marketing")}>
                <div className="cookie-pref-info">
                  <span className="cookie-pref-title">
                    {isAr ? "ملفات الارتباط التسويقية" : "Marketing Cookies"}
                  </span>
                  <span className="cookie-pref-desc">
                    {isAr ? "لتخصيص الإعلانات والعروض ذات الصلة بك." : "Enables personalized deals and advertisement targeting."}
                  </span>
                </div>
                <div className={`cookie-toggle ${preferences.marketing ? "active" : ""}`}>
                  <div className="cookie-toggle-slider" />
                </div>
              </div>

            </div>

            <div className="cookie-banner-prefs-actions">
              <button type="button" className="cookie-btn cookie-btn-save" onClick={handleSavePreferences}>
                {isAr ? "حفظ التفضيلات" : "Save Preferences"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
