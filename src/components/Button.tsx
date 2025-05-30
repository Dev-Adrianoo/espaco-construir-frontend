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
    "font-semibold rounded-xl shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles = {
    primary:
      "bg-primary text-white hover:bg-primary-light focus:ring-primary border border-primary",
    secondary:
      "bg-success text-white hover:bg-success-light focus:ring-success border border-success",
    outline:
      "bg-transparent border border-primary text-primary hover:bg-primary-light/10 focus:ring-primary",
    danger:
      "bg-danger text-white hover:bg-danger-dark focus:ring-danger border border-danger",
  };

  const sizeStyles = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2 px-4 text-base",
    lg: "py-3 px-6 text-lg",
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const disabledStyle = disabled
    ? "opacity-50 cursor-not-allowed"
    : "transform hover:scale-[1.03] active:scale-[0.98]";

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
