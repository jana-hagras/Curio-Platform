import { useTranslation } from "react-i18next";

export default function PrivacyPolicyPage() {
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
            {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 16, marginTop: 8 }}>
            {isAr
              ? "التزامنا بحماية بياناتك الشخصية وسريتها"
              : "Our commitment to protecting your personal data and confidentiality"}
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
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>١. المعلومات التي نجمعها</h2>
                <p>
                  نحن نجمع فقط المعلومات الضرورية لتشغيل منصة Curio بفاعلية وتقديم تجربة مستخدم مخصصة:
                </p>
                <ul>
                  <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، كلمة المرور، العنوان، ورقم الهاتف.</li>
                  <li><strong>معلومات المتجر (للحرفيين):</strong> السيرة الذاتية، صور الملف الشخصي، والمحفظة الفنية.</li>
                  <li><strong>معلومات الدفع:</strong> يتم معالجتها بأمان عبر بوابات الدفع المعتمدة، ولا نقوم بتخزين تفاصيل بطاقتك الائتمانية.</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٢. كيف نستخدم معلوماتك</h2>
                <p>تُستخدم بياناتك لتقديم خدماتنا وتحسينها، بما في ذلك:</p>
                <ul>
                  <li>تسهيل المعاملات والطلبات بين المشترين والحرفيين.</li>
                  <li>تقديم إمكانية المعاينة ثلاثية الأبعاد والمقترحات المخصصة عبر الذكاء الاصطناعي.</li>
                  <li>التواصل معك بشأن تحديثات الطلبات أو الحساب أو الرسائل التنبيهية.</li>
                  <li>مراقبة أداء المنصة وتحسين الأمان والامتثال للقوانين المعمول بها.</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٣. مشاركة البيانات وحمايتها</h2>
                <p>
                  خصوصيتك هي أولويتنا القصوى. نحن لا نبيع بياناتك الشخصية إلى أي طرف ثالث. نشارك فقط البيانات اللازمة مع موفري الخدمات المعنيين (مثل شركات الشحن والدفع) لإتمام طلباتك.
                </p>
                <p>
                  نقوم بتطبيق مجموعة من الإجراءات الأمنية والإلكترونية الصارمة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الكشف عنها.
                </p>
              </section>

              <section>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٤. حقوقك وحرياتك</h2>
                <p>
                  لديك كامل الحق في الوصول إلى معلوماتك الشخصية أو تعديلها أو طلب حذفها في أي وقت من خلال إعدادات حسابك، أو عبر مراسلتنا مباشرة على البريد الإلكتروني: <a href="mailto:hello@curio.com" style={{ color: "var(--accent-gold)" }}>hello@curio.com</a>.
                </p>
              </section>
            </div>
          ) : (
            <div>
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>1. Information We Collect</h2>
                <p>
                  We collect only the essential information needed to operate the Curio platform effectively and provide a personalized experience:
                </p>
                <ul>
                  <li><strong>Account Details:</strong> Name, email address, password, shipping address, and phone number.</li>
                  <li><strong>Artisan Information:</strong> Portfolio items, bio, profile images, and verification records.</li>
                  <li><strong>Payment Transactions:</strong> Processed securely via authorized payment gateways. We do not store credit card details.</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>2. How We Use Your Information</h2>
                <p>Your details are used to deliver and enhance our services, including:</p>
                <ul>
                  <li>Facilitating orders, requests, and milestone payments between Buyers and Artisans.</li>
                  <li>Powering our Gemini AI-driven 3D custom request tools.</li>
                  <li>Sending transactional emails, order status updates, and customer support notifications.</li>
                  <li>Ensuring platform security, preventing fraudulent activity, and meeting compliance guidelines.</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>3. Sharing and Protecting Data</h2>
                <p>
                  Your privacy is our core priority. We never sell your personal data. We only share information necessary for core operations (e.g., shipping providers, payment processors) to complete transactions.
                </p>
                <p>
                  We implement industry-standard encryption, firewalls, and security audits to defend your information against unauthorized access, disclosure, or modifications.
                </p>
              </section>

              <section>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>4. Your Choices and Rights</h2>
                <p>
                  You have the right to access, update, or request the complete deletion of your personal details at any time via your account settings, or by contacting our support team at <a href="mailto:hello@curio.com" style={{ color: "var(--accent-gold)" }}>hello@curio.com</a>.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
