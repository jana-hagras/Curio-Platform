const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{11}$/;
const NAME_RE = /^[A-Za-z\u0600-\u06FF\s'-]{2,50}$/;

export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(email.trim())) return 'Email format is invalid.';
  return null;
};

export const validatePassword = (password) => {
  const errors = [];
  if (!password) return 'Password is required.';
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/\d/.test(password)) errors.push('one number');
  if (errors.length) return `Password must contain ${errors.join(', ')}.`;
  return null;
};

export const validateName = (name, label = 'Name') => {
  if (!name || !name.trim()) return `${label} is required.`;
  if (!NAME_RE.test(name.trim())) return `${label} must be 2-50 characters, letters only.`;
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return null; // optional
  if (!PHONE_RE.test(phone.trim())) return 'Phone format is invalid.';
  return null;
};

export const validateRequired = (value, label = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) return `${label} is required.`;
  return null;
};

export const validateNumber = (value, label = 'Value', { min, max } = {}) => {
  if (value === '' || value == null) return `${label} is required.`;
  const num = Number(value);
  if (isNaN(num)) return `${label} must be a number.`;
  if (min != null && num < min) return `${label} must be at least ${min}.`;
  if (max != null && num > max) return `${label} must be at most ${max}.`;
  return null;
};
