import React from 'react';

export function Field({ label, type = 'text', placeholder, onChange, value, required = true }) {
  return (
    <label>
      {label}
      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}

export default Field;
