// Em src/hooks/useVerification.ts

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AxiosResponse } from "axios";
import { AuthResponse } from "../services/authService";
import { AuthData } from '../services/api';


export const useVerification = (verifyApiCall: (token: string) => Promise<AxiosResponse>) => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>('Verificando sua conta, por favor aguarde...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [loginData, setLoginData] = useState<AuthData | null>(null); 
  


  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage("Token de verificação não encontrado na URL.");
      return;
    }

    const processToken = async () => {
      
        const response = await verifyApiCall(token);

        if (response.status === 200) {
          setStatus('success');
          setMessage('Parabéns! Seu e-mail foi verificado.');
          setLoginData(response.data);
        } else {
          setMessage("Link de verificação inválido ou expirado, por favor tente fazer o login para solicitar um novo e-mail.");
          setStatus('error');
        }
      }
    
    processToken();

  }, [searchParams, verifyApiCall]);

  return { status, message, loginData};
};