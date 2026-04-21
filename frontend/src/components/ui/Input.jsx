import './Input.css';

export default function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  fullWidth = true,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${fullWidth ? 'input-full' : ''} ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon className="input-icon" />}
        <input
          id={inputId}
          type={type}
          className={`input-field ${Icon ? 'input-with-icon' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
