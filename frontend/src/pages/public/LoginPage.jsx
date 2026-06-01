import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { FiMail, FiLock } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import "./AuthPages.css";
import logo from "../../assets/logo.png";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = t('common:validation.emailRequired');
    if (!form.password) errs.password = t('common:validation.passwordRequired');
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      toast.success(t('common:time.justNow')); // Or any success toast
      // Role-based redirect
      if (userData.type === 'Admin') {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      toast.error(err.message || t('login.error'));
      if (err.errors?.length) {
        const mapped = {};
        err.errors.forEach((e) => {
          mapped.general = e;
        });
        setErrors(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <img src={logo} alt="CURIO" className="auth-logo-img" />
          <h2>{t('common:nav.adminPanel') === 'Admin Panel' ? 'Welcome to CURIO' : 'مرحباً بك في كيريو'}</h2>
          <p>
            {t('common:nav.adminPanel') === 'Admin Panel' 
              ? 'Discover authentic Egyptian craftsmanship and connect with master artisans.'
              : 'اكتشف الحرف اليدوية المصرية الأصيلة وتواصل مع أمهر الحرفيين.'}
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">{t('login.submit')}</h1>
          <p className="auth-subtitle">
            {t('login.subtitle')}
          </p>

          {errors.general && (
            <div className="auth-error-banner">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <Input
              label={t('login.email')}
              name="email"
              type="email"
              icon={FiMail}
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input
              label={t('login.password')}
              name="password"
              type="password"
              icon={FiLock}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              {t('login.submit')}
            </Button>
          </form>

          <p className="auth-switch">
            {t('login.noAccount')} <Link to="/register">{t('login.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

