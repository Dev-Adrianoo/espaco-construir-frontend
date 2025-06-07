import React from "react";
import Modal from "./Modal";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Erro">
      <div className="flex flex-col items-center justify-center p-6">
        <svg
          className="w-12 h-12 text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <p className="text-lg text-red-700 text-center">{message}</p>
      </div>
    </Modal>
  );
};

export default ErrorModal;
