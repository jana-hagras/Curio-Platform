export default function Spinner({ size = 40, color = 'var(--gold-primary)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid var(--surface-border)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
