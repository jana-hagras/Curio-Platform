import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
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
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`input-group ${fullWidth ? 'input-full' : ''} ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon className="input-icon" />}
        <input
          id={inputId}
          type={inputType}
          className={`input-field ${Icon ? 'input-with-icon' : ''} ${isPassword ? 'input-with-password-toggle' : ''}`}
          {...props}
        />
        {isPassword && (
          <button 
            type="button" 
            className="input-password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex="-1"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
