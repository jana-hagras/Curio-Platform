export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      {Icon && (
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--sand-warm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Icon style={{ fontSize: 36, color: 'var(--text-tertiary)' }} />
        </div>
      )}
      <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>{title || 'No data found'}</h3>
      {message && <p style={{ color: 'var(--text-secondary)', maxWidth: 400, marginBottom: action ? 20 : 0 }}>{message}</p>}
      {action}
    </div>
  );
}
