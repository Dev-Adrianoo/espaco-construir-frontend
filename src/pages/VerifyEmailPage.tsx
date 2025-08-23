import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVerification } from '../hooks/useVerification';
import authService from '../services/authService';
import logo from "../images/espaco-construir-logo-Photoroom.png";
import { MailCheck, XCircle, Loader} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, message, loginData } = useVerification(authService.verifyEmail);
  const { handleAuthentication , user } = useAuth();

  useEffect(() => {
    if(loginData) {
      handleAuthentication(loginData);
    }
  }, [loginData, handleAuthentication])

 
  useEffect(() => {
    
    if (status === 'success' && user) {
      const timer = setTimeout(() => {
       const destination = user.role === 'PROFESSORA' ? '/teacher-dashboard' : '/children';

        navigate(destination, {replace: true});

      }, 10000);

      return () => clearTimeout(timer);
    }

  }, [status, navigate, user]);

  const finalMessage = status === 'success'
    ? 'Parabéns! Seu e-mail foi verificado.'
    : message;

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <MailCheck className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'loading':
      default:
        return <Loader className="h-12 w-12 text-blue-500 animate-spin" />;
    }
  };

  return (

    <div className="relative flex items-center justify-center min-h-screen bg-blue-300 overflow-hidden">

      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0]">
          <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-blue-100"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-blue-100"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-blue-100"></path>
          </svg>
      </div>


      <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo Instituto Construir" className="h-16" />
        </div>
        <div className={`text-center p-6 rounded-md ${
          status === 'success' ? 'bg-green-50 text-green-800' :
          status ==='error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <h2 className="text-xl font-bold mb-2">{finalMessage}</h2>
          {status === 'success' && (
            <p className="text-sm">
             Você será redirecionado para a plataforma em 10 segundos.
            </p>
          )}
          <button
            onClick={() => {
              
              if (user) {
                const destination = user.role === 'PROFESSORA' ? '/teacher-dashboard' : '/children'
                navigate(destination, {replace: true})
              }else {
                navigate('/')}
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
            Voltar para o Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;