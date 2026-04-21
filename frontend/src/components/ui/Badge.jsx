import { STATUS_COLORS } from '../../utils/constants';

export default function Badge({ status, children }) {
  const text = children || status;
  const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: '13px',
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}
