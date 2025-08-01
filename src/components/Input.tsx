import React from "react";

type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  id: string;
  name: string;
  error?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
  readOnly?: boolean;
  max?: string;  // Para inputs do tipo date
  min?: string;  // Para inputs do tipo date
};

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  required = false,
  id,
  name,
  error,
  className = "",
  maxLength,
  disabled,
  readOnly,
  max,
  min,
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
      <input
        type={type}
        id={id}
        name={name}
        className={`w-full px-3 py-2 border ${
          error ? "border-[#B91C1C]" : "border-gray-300"
        } 
                   rounded-lg shadow-sm focus:outline-none focus:ring-2 
                   focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        readOnly={readOnly}
        max={max}
        min={min}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
export type { InputProps };
