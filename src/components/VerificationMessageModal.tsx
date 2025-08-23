import React from "react";
import Modal from './Modal';
import { MailCheck } from "lucide-react";

interface VerificationMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

const VerificationMessageModal: React.FC<VerificationMessageModalProps> = ({isOpen, onClose, userEmail}) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quase lá!" zIndex={1000}>
      <div className="flex flex-col items-center justify-center text-center p-4">
        <MailCheck className="h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          E-mail de verificação enviado!
        </h3>
        <p className="text-gray-600 mb-4">
          Enviamos um link de confirmação para o endereço:
        </p>
        <p className="text-blue-600 font-medium mb-4">{userEmail}</p>
        <p className="text-gray-500 text-sm">
          Por favor, Verifique sua caixa de entrada (e a pasta de spam) e clique no link para ativar sua conta.
        </p>

        <button
        onClick={onClose}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Ir para login
        </button>
      </div>
    </Modal>
  )
}

export default VerificationMessageModal