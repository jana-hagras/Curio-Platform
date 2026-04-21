import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../../components/ui/Input";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import { FiMail, FiLock, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import "./AuthPages.css";
import logo from "../../assets/logo.png";

export default function RegisterPage() {
  const [userType, setUserType] = useState("Buyer");
  const [form, setForm] = useState({
    fName: "",
    lName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    country: "",
    bio: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fName.trim()) errs.fName = "First name is required.";
    if (!form.lName.trim()) errs.lName = "Last name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    if (!form.password) {
      errs.password = "Password is required.";
    } else {
      const pwIssues = [];
      if (form.password.length < 8) pwIssues.push("at least 8 characters");
      if (!/[A-Z]/.test(form.password)) pwIssues.push("one uppercase letter");
      if (!/[a-z]/.test(form.password)) pwIssues.push("one lowercase letter");
      if (!/[0-9]/.test(form.password)) pwIssues.push("one number");
      if (pwIssues.length > 0) {
        errs.password = "Password needs: " + pwIssues.join(", ") + ".";
      }
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await register({ ...form, type: userType });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <img src={logo} alt="CURIO" className="auth-logo-img" />
          <h2>Join CURIO</h2>
          <p>
            Create your account and start exploring Egypt's finest artisan
            craftsmanship.
          </p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            Choose your account type to get started.
          </p>

          <div className="auth-type-selector">
            <div
              className={`auth-type-btn ${userType === "Buyer" ? "auth-type-active" : ""}`}
              onClick={() => setUserType("Buyer")}
            >
              <h4>🛒 Buyer</h4>
              <p>Shop & request custom items</p>
            </div>
            <div
              className={`auth-type-btn ${userType === "Artisan" ? "auth-type-active" : ""}`}
              onClick={() => setUserType("Artisan")}
            >
              <h4>🎨 Artisan</h4>
              <p>Sell your handmade crafts</p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
            id="register-form"
          >
            <div className="auth-form-row">
              <Input
                label="First Name"
                name="fName"
                icon={FiUser}
                placeholder="First name"
                value={form.fName}
                onChange={handleChange}
                error={errors.fName}
              />
              <Input
                label="Last Name"
                name="lName"
                icon={FiUser}
                placeholder="Last name"
                value={form.lName}
                onChange={handleChange}
                error={errors.lName}
              />
            </div>
            <Input
              label="Email"
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
              placeholder="Min 8 characters"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Input
              label="Phone (optional)"
              name="phone"
              placeholder="+20 xxx xxx xxxx"
              value={form.phone}
              onChange={handleChange}
            />
            <Input
              label="Address (optional)"
              name="address"
              placeholder="Your address"
              value={form.address}
              onChange={handleChange}
            />
            {userType === "Buyer" && (
              <Input
                label="Country"
                name="country"
                placeholder="Your country"
                value={form.country}
                onChange={handleChange}
              />
            )}
            {userType === "Artisan" && (
              <TextArea
                label="Bio"
                name="bio"
                placeholder="Tell us about your craft..."
                value={form.bio}
                onChange={handleChange}
                rows={3}
              />
            )}
            <Button type="submit" fullWidth loading={loading} size="lg">
              Create Account
            </Button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
