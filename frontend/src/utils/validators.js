import i18next from 'i18next';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]{11}$/;
const NAME_RE = /^[A-Za-z\u0600-\u06FF\s'-]{2,50}$/;

export const validateEmail = (email) => {
  if (!email || !email.trim()) return i18next.t('common:validation.emailRequired');
  if (!EMAIL_RE.test(email.trim())) return i18next.t('common:validation.emailInvalid');
  return null;
};

export const validatePassword = (password) => {
  const errors = [];
  if (!password) return i18next.t('common:validation.passwordRequired');
  if (password.length < 8) errors.push(i18next.t('common:validation.passwordMin'));
  if (!/[A-Z]/.test(password)) errors.push(i18next.t('common:validation.passwordUpper'));
  if (!/[a-z]/.test(password)) errors.push(i18next.t('common:validation.passwordLower'));
  if (!/\d/.test(password)) errors.push(i18next.t('common:validation.passwordNumber'));
  if (errors.length) {
    return i18next.t('common:validation.passwordRules', { rules: errors.join(', ') });
  }
  return null;
};

export const validateName = (name, label = 'Name') => {
  if (!name || !name.trim()) return i18next.t('common:validation.nameRequired', { label });
  if (!NAME_RE.test(name.trim())) return i18next.t('common:validation.nameInvalid', { label });
  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) return null; // optional
  if (!PHONE_RE.test(phone.trim())) return i18next.t('common:validation.phoneInvalid');
  return null;
};

export const validateRequired = (value, label = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return i18next.t('common:validation.nameRequired', { label });
  }
  return null;
};

export const validateNumber = (value, label = 'Value', { min, max } = {}) => {
  if (value === '' || value == null) return i18next.t('common:validation.nameRequired', { label });
  const num = Number(value);
  if (isNaN(num)) return i18next.t('common:validation.numberInvalid', { label });
  if (min != null && num < min) return i18next.t('common:validation.numberMin', { label, min });
  if (max != null && num > max) return i18next.t('common:validation.numberMax', { label, max });
  return null;
};

