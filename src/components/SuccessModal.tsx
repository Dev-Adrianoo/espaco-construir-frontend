import React from "react";
import Modal from "./Modal";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sucesso">
      <div className="flex flex-col items-center justify-center p-6">
        <svg
          className="w-12 h-12 text-green-500 mb-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p className="text-lg text-green-700 text-center">{message}</p>
      </div>
    </Modal>
  );
};

export default SuccessModal;
