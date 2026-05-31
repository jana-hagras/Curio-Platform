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

export const PAYMENT_METHODS = ['COD', 'Card']; // For backwards compat

export const PAYMENT_METHODS_MARKETPLACE = {
  egypt: ['COD', 'Card'],
  international: ['Card'],
};
export const PAYMENT_METHODS_SERVICES = ['Card']; // Workshops & Mentorships: Card only
export const PLATFORM_COMMISSION_RATE = 0.10; // Display only — server is source of truth

export const ORDER_STATUSES = ['Pending', 'Completed'];
export const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed'];
export const APPLICATION_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const MILESTONE_STATUSES = ['Pending', 'Completed'];
export const ARTISAN_STATUSES = ['Active', 'Inactive'];
export const MENTORSHIP_STATUSES = ['Active', 'Inactive'];
export const MENTORSHIP_APPLICATION_STATUSES = ['Pending', 'AwaitingPayment', 'Accepted', 'Rejected', 'Completed'];
export const WORKSHOP_STATUSES = ['Upcoming', 'Completed', 'Cancelled'];
export const WORKSHOP_REGISTRATION_STATUSES = ['Pending', 'Confirmed', 'Cancelled'];

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
  // Mentorship application statuses
  AwaitingPayment: { bg: '#EFF6FF', text: '#1D4ED8' },
  Accepted: { bg: '#DBEAFE', text: '#1E40AF' },
  // Workshop statuses
  Upcoming: { bg: '#EDE9FE', text: '#5B21B6' },
  Confirmed: { bg: '#D1FAE5', text: '#065F46' },
  Cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};
