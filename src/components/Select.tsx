import React from 'react';

type Option = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  options: Option[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  id: string;
  name: string;
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
  id,
  name,
  error,
  className = '',
  placeholder,
  disabled = false,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        name={name}
        className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} 
                   rounded-lg shadow-sm focus:outline-none focus:ring-2 
                   focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 
                   bg-white`}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;