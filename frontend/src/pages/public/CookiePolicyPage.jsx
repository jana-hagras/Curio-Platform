import { useTranslation } from "react-i18next";

export default function CookiePolicyPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div style={{ background: "var(--background-secondary)", minHeight: "100vh" }}>
      <div
        style={{
          background: "var(--navy-deep)",
          color: "#fff",
          padding: "60px 0",
          textAlign: "center",
          borderBottom: "3px solid var(--accent-gold)",
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: 36, fontWeight: 700, color: "var(--accent-gold)" }}>
            {isAr ? "سياسة ملفات الارتباط (Cookies)" : "Cookie Policy"}
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 16, marginTop: 8 }}>
            {isAr
              ? "تفاصيل استخدام ملفات تعريف الارتباط وخيارات التحكم المتاحة لك"
              : "Details on how we use cookies and the control choices you have"}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "40px 24px" }}>
        <div
          style={{
            background: "var(--surface-primary)",
            padding: "40px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--surface-border)",
            boxShadow: "var(--shadow-sm)",
            lineHeight: 1.8,
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
        >
          {isAr ? (
            <div dir="rtl" style={{ textAlign: "right" }}>
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>١. ما هي ملفات تعريف الارتباط؟</h2>
                <p>
                  ملفات تعريف الارتباط هي ملفات نصية صغيرة يتم تخزينها على جهاز الكمبيوتر أو الهاتف الذكي عند تصفح منصتنا. تساعدنا هذه الملفات على توفير أداء أفضل وتجربة مخصصة وسلسة.
                </p>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٢. تصنيفات ملفات الارتباط المستخدمة</h2>
                <p>نحن نستخدم ملفات تعريف الارتباط المقسمة إلى الفئات التالية:</p>
                
                <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>ملفات تعريف الارتباط الضرورية (Necessary)</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      مطلوبة لتمكين الوظائف الأساسية للمنصة مثل تسجيل الدخول الآمن، إضافة المنتجات إلى السلة، وإتمام عملية الشراء. لا يمكن إيقاف هذا النوع من ملفات الارتباط.
                    </p>
                  </div>
                  
                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>ملفات تعريف الارتباط الوظيفية (Functional)</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      تسمح للمنصة بتذكر التفضيلات التي اخترتها (مثل اللغة المفضلة كالعربية أو وضع المظهر الداكن) لتوفير تجربة مستخدم محسنة وشخصية.
                    </p>
                  </div>

                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>ملفات تعريف الارتباط التحليلية (Analytics)</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      تساعدنا على فهم كيفية تفاعل الزوار مع المنصة، وقياس عدد الزوار، وتحديد الصفحات الأكثر شعبية لتحسين جودة وأداء منصة Curio بشكل مستمر.
                    </p>
                  </div>

                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>ملفات تعريف الارتباط التسويقية (Marketing)</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      تُستخدم لتتبع الزوار عبر المواقع الإلكترونية لتخصيص الإعلانات ذات الصلة باهتماماتهم (تدعم المنصة حالياً تهيئة مستقبلية لهذه الفئة).
                    </p>
                  </div>
                </div>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٣. إدارة تفضيلاتك</h2>
                <p>
                  عند زيارتك الأولى للمنصة، ستظهر لك لافتة إعدادات الخصوصية. يمكنك اختيار قبول جميع ملفات تعريف الارتباط أو رفض غير الضرورية، أو تحديد الخيارات يدوياً في أي وقت.
                </p>
                <p>
                  يمكنك أيضاً التحكم في ملفات تعريف الارتباط أو مسحها عبر إعدادات متصفح الإنترنت الخاص بك.
                </p>
              </section>
            </div>
          ) : (
            <div>
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>1. What Are Cookies?</h2>
                <p>
                  Cookies are tiny text files stored on your browser or device when you browse our platform. They help us provide optimal load performance, keep you logged in, and personalize your experience.
                </p>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>2. How We Use Cookies</h2>
                <p>We classify the cookies we run into the following categories:</p>

                <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>Necessary Cookies</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      Required for security, account authorization, item carting, and checkout transactions. Without these, core platform features cannot run.
                    </p>
                  </div>

                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>Functional Cookies</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      Let us remember your settings (such as your chosen language - Arabic/English, or your dark mode preference) to ensure a smooth, tailored interaction.
                    </p>
                  </div>

                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>Analytics Cookies</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      Provide data on page hits, navigation flow patterns, and checkout conversion rates, helping us continuously optimize Curio's speed and layout.
                    </p>
                  </div>

                  <div style={{ padding: 16, background: "var(--background-secondary)", borderRadius: "var(--radius-md)" }}>
                    <h3 style={{ color: "var(--accent-gold)", fontSize: 18, margin: "0 0 8px 0" }}>Marketing Cookies</h3>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      Used to understand consumer preferences and deliver relevant target advertisements (reserved for future platform promotion integration).
                    </p>
                  </div>
                </div>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>3. Managing Your Preferences</h2>
                <p>
                  When you visit the site, you have the option to accept all cookies, reject non-essential ones, or customize your categories via the preference settings banner.
                </p>
                <p>
                  Additionally, you can configure your browser to block cookies entirely or clear them at your discretion.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
