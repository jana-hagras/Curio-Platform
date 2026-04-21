import './Input.css';

export default function Select({
  label,
  error,
  options = [],
  fullWidth = true,
  placeholder = 'Select...',
  className = '',
  id,
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${fullWidth ? 'input-full' : ''} ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={selectId} className="input-label">{label}</label>}
      <select id={selectId} className="select-field" {...props}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
