import i18next from 'i18next';

export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '$0.00';
  const locale = i18next.language === 'ar' ? 'ar-EG' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
};

