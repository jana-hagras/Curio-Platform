import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import TextArea from "../../components/ui/TextArea";
import CountrySelect from "../../components/ui/CountrySelect";
import Button from "../../components/ui/Button";
import { FiMail, FiLock, FiUser, FiCamera } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { uploadService } from "../../services/uploadService";
import "./AuthPages.css";
import logo from "../../assets/logo.png";

export default function RegisterPage() {
  const [userType, setUserType] = useState("Buyer");
  const [form, setForm] = useState({
    fName: "",
    lName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    country: "",
    bio: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { register } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fName.trim()) errs.fName = t('common:validation.nameRequired', { label: t('register.firstName') });
    if (!form.lName.trim()) errs.lName = t('common:validation.nameRequired', { label: t('register.lastName') });
    if (!form.email.trim()) errs.email = t('common:validation.emailRequired');
    if (!form.password) {
      errs.password = t('common:validation.passwordRequired');
    } else {
      const pwIssues = [];
      if (form.password.length < 8) pwIssues.push(t('common:validation.passwordMin'));
      if (!/[A-Z]/.test(form.password)) pwIssues.push(t('common:validation.passwordUpper'));
      if (!/[a-z]/.test(form.password)) pwIssues.push(t('common:validation.passwordLower'));
      if (!/[0-9]/.test(form.password)) pwIssues.push(t('common:validation.passwordNumber'));
      if (pwIssues.length > 0) {
        errs.password = t('common:validation.passwordRules', { rules: pwIssues.join(', ') });
      }
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = t('register.passwordMismatch');
    }
    if (userType === "Buyer" && !form.country) {
      errs.country = t('common:validation.nameRequired', { label: t('register.country') });
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = "";
      if (imageFile) {
        try {
          const uploadRes = await uploadService.uploadImage(imageFile);
          finalImageUrl = uploadRes?.imageUrl || uploadRes?.data?.imageUrl || "";
        } catch (uploadErr) {
          toast.error(t('common:nav.adminPanel') === 'Admin Panel' ? "Image upload failed, proceeding without image." : "فشل تحميل الصورة، جاري المتابعة بدونها.");
        }
      }

      await register({ ...form, type: userType, profileImage: finalImageUrl });
      toast.success(t('register.success'));
      navigate("/login");
    } catch (err) {
      toast.error(err.message || t('common:nav.adminPanel') === 'Admin Panel' ? "Registration failed" : "فشلت عملية التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <img src={logo} alt="CURIO" className="auth-logo-img" />
          <h2>{t('register.title')}</h2>
          <p>
            {t('common:nav.adminPanel') === 'Admin Panel' 
              ? "Create your account and start exploring Egypt's finest artisan craftsmanship."
              : "أنشئ حسابك وابدأ في استكشاف أفضل الحرف اليدوية والفنية المصرية."}
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">{t('register.submit')}</h1>
          <p className="auth-subtitle">
            {t('register.subtitle')}
          </p>

          <div className="auth-type-selector">
            <div
              className={`auth-type-btn ${userType === "Buyer" ? "auth-type-active" : ""}`}
              onClick={() => setUserType("Buyer")}
            >
              <h4>🛒 {t('register.buyer')}</h4>
              <p>{t('register.buyerDesc')}</p>
            </div>
            <div
              className={`auth-type-btn ${userType === "Artisan" ? "auth-type-active" : ""}`}
              onClick={() => setUserType("Artisan")}
            >
              <h4>🎨 {t('register.artisan')}</h4>
              <p>{t('register.artisanDesc')}</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
            id="register-form"
          >
            <div className="auth-avatar-upload-container">
              <div className="auth-avatar-upload-wrapper">
                <div className="auth-avatar-preview">
                  {previewUrl ? <img src={previewUrl} alt="" /> : <FiUser />}
                </div>
                <label className="auth-avatar-label">
                  <FiCamera />
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <div className="auth-form-row">
              <Input
                label={t('register.firstName')}
                name="fName"
                icon={FiUser}
                placeholder="First name"
                value={form.fName}
                onChange={handleChange}
                error={errors.fName}
              />
              <Input
                label={t('register.lastName')}
                name="lName"
                icon={FiUser}
                placeholder="Last name"
                value={form.lName}
                onChange={handleChange}
                error={errors.lName}
              />
            </div>
            <Input
              label={t('register.email')}
              name="email"
              type="email"
              icon={FiMail}
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input
              label={t('register.password')}
              name="password"
              type="password"
              icon={FiLock}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Input
              label={t('register.confirmPassword')}
              name="confirmPassword"
              type="password"
              icon={FiLock}
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
            <Input
              label={t('register.phone')}
              name="phone"
              placeholder="+20 xxx xxx xxxx"
              value={form.phone}
              onChange={handleChange}
            />
            <Input
              label={t('register.address')}
              name="address"
              placeholder="Cairo, Egypt"
              value={form.address}
              onChange={handleChange}
            />
            {userType === "Buyer" && (
              <CountrySelect
                label={t('register.country')}
                value={form.country}
                onChange={handleChange}
                error={errors.country}
                required
              />
            )}
            {userType === "Artisan" && (
              <TextArea
                label={t('register.bio')}
                name="bio"
                placeholder={t('register.bioPlaceholder')}
                value={form.bio}
                onChange={handleChange}
                rows={3}
              />
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              {t('register.submit')}
            </Button>
          </form>
          <p className="auth-switch">
            {t('register.hasAccount')} <Link to="/login">{t('register.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

