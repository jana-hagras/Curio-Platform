import { useTranslation } from "react-i18next";

export default function TermsPage() {
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
            {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 16, marginTop: 8 }}>
            {isAr
              ? "شروط الاستخدام، السياسات المالية، وحقوق الملكية الفكرية لمنصة Curio"
              : "Usage conditions, financial rules, and intellectual property policies of Curio"}
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
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>١. قواعد المنصة وسلوك المستخدم</h2>
                <p>
                  من خلال إنشاء حساب في منصة Curio، فإنك توافق على الالتزام بالقواعد والتعليمات التالية:
                </p>
                <ul>
                  <li>تقديم معلومات صحيحة ودقيقة عند التسجيل أو إضافة المنتجات.</li>
                  <li>احترام خصوصية المستخدمين الآخرين وحقوق الملكية الفكرية للأعمال والحرف اليدوية.</li>
                  <li>عدم استخدام المنصة لأي أغراض احتيالية أو غير قانونية.</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٢. المعاملات والسياسات المالية</h2>
                <p>
                  تخضع جميع المعاملات المالية المكتملة عبر المنصة للسياسات التالية:
                </p>
                <ul>
                  <li><strong>رسوم العمولة:</strong> تقتطع منصة Curio نسبة ١٠٪ كعمولة من إجمالي قيمة معاملات بيع المنتجات، التسجيل في ورش العمل، وحصص التوجيه (Mentorships). ويحصل الحرفي على ٩٠٪ من الأرباح.</li>
                  <li><strong>نظام الضمان (Escrow):</strong> في الطلبات المخصصة (Custom Requests)، يتم الاحتفاظ بالميزانية في حساب الضمان التابع للمنصة، ويتم تحرير الدفعات تباعاً للحرفي عند موافقة المشتري على إنجاز كل مرحلة (Milestone).</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٣. حقوق الملكية الفكرية</h2>
                <p>
                  يحتفظ الحرفيون بالحقوق الملكية الحصرية لتصاميمهم وصور منتجاتهم المعروضة في محفظتهم الفنية. لا يُسمح بإعادة استخدام أو نسخ أي محتوى فني أو صور من منصة Curio دون إذن مسبق وصريح من المالك.
                </p>
              </section>

              <section>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>٤. تسوية النزاعات وإخلاء المسؤولية</h2>
                <p>
                  تسعى Curio لتوفير بيئة تداول آمنة وعادلة. نحن لا نتحمل المسؤولية المباشرة عن جودة المنتجات أو تأخير موعد التسليم من قبل الحرفيين، ولكننا نلتزم بالوساطة والتحكيم الودي لحل النزاعات بين المشترين والحرفيين لضمان رضا الطرفين.
                </p>
              </section>
            </div>
          ) : (
            <div>
              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>1. Platform Rules and User Conduct</h2>
                <p>
                  By creating an account and participating in the Curio marketplace, you agree to follow our code of conduct:
                </p>
                <ul>
                  <li>Provide authentic, accurate information during registration and shop listings.</li>
                  <li>Respect copyright, intellectual property, and design ownership of all Egyptian artisan creations.</li>
                  <li>Refrain from engaging in fraudulent activities, spam, or off-platform transactions.</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>2. Payments and Financial Terms</h2>
                <p>
                  All purchases, workshop bookings, and mentorship fees are governed by the following transactional rules:
                </p>
                <ul>
                  <li><strong>Platform Commission:</strong> Curio retains a standard 10% platform fee on all sales, custom requests, workshops, and mentorship sessions. Artisans receive 90% of the funds.</li>
                  <li><strong>Escrow Mechanism:</strong> For custom requests, buyer funds are held in Escrow. Payouts are released dynamically to the artisan as milestones are marked completed and approved by the buyer.</li>
                </ul>
              </section>

              <section style={{ marginBottom: 32 }}>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>3. Intellectual Property Rights</h2>
                <p>
                  Artisans hold full ownership of their designs, custom bid models, and portfolio photographs. Replicating, stealing, or distributing media assets from Curio without the express permission of the original artisan is prohibited.
                </p>
              </section>

              <section>
                <h2 style={{ color: "var(--accent-gold)", fontSize: 22, marginBottom: 12 }}>4. Dispute Resolution & Liability</h2>
                <p>
                  While Curio serves as a facilitator for trade and support, we are not directly responsible for item delays or individual disputes. However, we offer full mediation and support services to guarantee resolution of escrow or delivery issues.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
