import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden border border-blue-100 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-6 py-4 border-b border-blue-100 bg-blue-50 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-6 py-4 border-t border-blue-100 bg-blue-50 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
