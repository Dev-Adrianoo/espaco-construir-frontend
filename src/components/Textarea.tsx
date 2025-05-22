import React from 'react';

type TextareaProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  id: string;
  name: string;
  rows?: number;
  error?: string;
  className?: string;
};

const Textarea: React.FC<TextareaProps> = ({
  label,
  placeholder = '',
  value,
  onChange,
  required = false,
  id,
  name,
  rows = 4,
  error,
  className = '',
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
      <textarea
        id={id}
        name={name}
        rows={rows}
        className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} 
                   rounded-lg shadow-sm focus:outline-none focus:ring-2 
                   focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Textarea;