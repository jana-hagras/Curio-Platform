export const CATEGORIES = [
  'Pottery',
  'Jewelry',
  'Textiles',
  'Woodwork',
  'Glasswork',
  'Metalwork',
  'Leather',
  'Papyrus',
  'Sculpture',
  'Calligraphy',
  'Mosaic',
  'Embroidery',
  'Other',
];

export const PAYMENT_METHODS = ['Cash', 'Visa', 'MasterCard', 'PayPal'];

export const ORDER_STATUSES = ['Pending', 'Completed'];
export const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed'];
export const APPLICATION_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const MILESTONE_STATUSES = ['Pending', 'Completed'];
export const ARTISAN_STATUSES = ['Active', 'Inactive'];

export const USER_TYPES = {
  BUYER: 'Buyer',
  ARTISAN: 'Artisan',
};

export const STATUS_COLORS = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Completed: { bg: '#D1FAE5', text: '#065F46' },
  Failed: { bg: '#FEE2E2', text: '#991B1B' },
  Approved: { bg: '#D1FAE5', text: '#065F46' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
  Active: { bg: '#D1FAE5', text: '#065F46' },
  Inactive: { bg: '#F3F4F6', text: '#6B7280' },
};
