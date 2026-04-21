import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { FiMail, FiLock } from "react-icons/fi";
import toast from "react-hot-toast";
import "./AuthPages.css";
import logo from "../../assets/logo.png";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    if (!form.password) errs.password = "Password is required.";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Login failed");
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
          <h2>Welcome to CURIO</h2>
          <p>
            Discover authentic Egyptian craftsmanship and connect with master
            artisans.
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-subtitle">
            Welcome back! Please sign in to your account.
          </p>

          {errors.general && (
            <div className="auth-error-banner">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <Input
              label="Email Address"
              name="email"
              type="email"
              icon={FiMail}
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              icon={FiLock}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
