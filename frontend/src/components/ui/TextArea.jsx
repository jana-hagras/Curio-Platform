import './Input.css';

export default function TextArea({
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  rows = 4,
  ...props
}) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${fullWidth ? 'input-full' : ''} ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={textareaId} className="input-label">{label}</label>}
      <textarea
        id={textareaId}
        className="textarea-field"
        rows={rows}
        {...props}
      />
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
