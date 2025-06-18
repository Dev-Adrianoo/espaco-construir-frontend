import React from "react";
import InputMask from "react-input-mask";

type MaskedInputProps = {
  label: string;
  mask: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  id: string;
  name: string;
  error?: string;
  className?: string;
};

const MaskedInput: React.FC<MaskedInputProps> = ({
  label,
  mask,
  placeholder = "",
  value,
  onChange,
  required = false,
  id,
  name,
  error,
  className = "",
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
      <InputMask
        mask={mask}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
        placeholder={placeholder}
        id={id}
        name={name}
        required={required}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default MaskedInput;
