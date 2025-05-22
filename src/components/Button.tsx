import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  fullWidth = false,
}) => {
  const baseStyles =
    "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles = {
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] focus:ring-[var(--accent)]",
    secondary: "bg-blue-100 text-[var(--accent-dark)] hover:bg-blue-200 focus:ring-[var(--accent)]",
    outline: "bg-transparent border border-[var(--accent)] text-[var(--accent-dark)] hover:bg-blue-50 focus:ring-[var(--accent)]",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  const sizeStyles = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2 px-4 text-base",
    lg: "py-3 px-6 text-lg",
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const disabledStyle = disabled
    ? "opacity-50 cursor-not-allowed"
    : "transform hover:scale-[1.02] active:scale-[0.98]";

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${disabledStyle} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
