import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-card rounded-2xl shadow-lg overflow-hidden border border-primary/20 ${className}`}
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
      className={`px-8 py-5 border-b border-primary/10 bg-primary-light/20 ${className}`}
    >
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardProps> = ({ children, className = "" }) => {
  return <div className={`px-8 py-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<CardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-8 py-5 border-t border-primary/10 bg-primary-light/20 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
