import React, {useState, useEffect} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import toast from "react-hot-toast";
import Input from "../components/Input";
import Button from "../components/Button";
import { LockKeyhole, Eye, EyeOff } from "lucide-react";


export default function ResetPasswordPage() {
  const [ searchParams ] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false) 

  


  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if(tokenFromUrl){
      setToken(tokenFromUrl);

    }else {
      setError("Token de redefinição não encontrado ou inválido.");
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if(password !== passwordConfirm) {
      toast.error("As senhas não coincidem.");
      return;

    }
    if(password.length < 6){  
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;

    }
    setIsLoading(true);
   try {
    
    await apiService.resetPassword({ token, newPassword: password});

    setSuccess('Senha Definida com sucesso! Você será redirecionado para o login.')
    toast.success('Senha redefinida com sucesso!')

    setTimeout(() => {
      navigate('/');
    }, 3000)

   }catch (err) {
    toast.error('Link inválido ou expirado. Por favor, Solicite uma nova redefinição.')

   }finally {
    setIsLoading(false);
   }
  }

  return (
    <div className="min-h-screen flex items-center bg-newPasswordPage-svg justify-center"
    // style={{
    //   backgroundColor : '#F5FFFA',
    //   backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%234A5568' fill-opacity='0.4'%3E%3Cpath d='M0 0h80v80H0z' fill='%23f0fdf4'/%3E%3Cpath d='M28 32C12.536 32 0 44.536 0 60s12.536 28 28 28c.023 0 .046 0 .068-.002l-.068.002c15.464 0 28-12.536 28-28S43.464 32 28 32zm0 0l-3.332 4.998C13.844 40.43 8 49.565 8 60c0 11.046 8.954 20 20 20s20-8.954 20-20c0-10.435-5.844-19.57-16.668-23.002L28 32zm0 0c15.464 0 28 12.536 28 28s-12.536 28-28 28c-.023 0-.046 0-.068-.002l.068.002c-15.464 0-28-12.536-28-28S12.536 32 28 32zm0 0l3.332 4.998C41.156 40.43 47 49.565 47 60c0 11.046-8.954 20-20 20S7 71.046 7 60c0-10.435 5.844-19.57 16.668-23.002L28 32z'/%3E%3C/g%3E%3C/svg%3E")`
    // }}
    >
      <div className="max-w w-[80%] sm:w-[450px]  p-8 bg-white shadow-lg rounded-xl">

        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 hover:bg-red-200 transition-all p-3 rounded-full">
            <LockKeyhole className="h-8 w-8 text-blue-500 hover:text-red-500 transition-all" />
          </div>
        </div>
        <h2 className="text-3xl mb-3 text-center font-bold text-blue-700">
          Instituto Construir
        </h2>
        <h2 className="text-base text-center mb-6">Crie sua nova Senha!</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
          <Input
          name="password"
          id="recovery-password"
          label="Nova senha"
          type={showPassword ? 'text' : 'password'}
          value={password}
          placeholder="Digite a nova senha"
          onChange={(e) => setPassword(e.target.value)}
          required
          >
          </Input>
          <button
            type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-[35px] right-3 flex items-center text-gray-500 hover:text-gray-700">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
          <Input
          name="newPassword"
          id="recovery-confirmPassword"
          label="Confirme a nova senha"
          type={showConfirmPassword ? 'text' : 'password'}
          value={passwordConfirm}
          placeholder="Confirme a nova senha"
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          >
          </Input>
          <button
            type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute top-[35px] right-3 flex items-center text-gray-500 hover:text-gray-700">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          <Button type="submit" className="w-full !mt-8" disabled={isLoading}>
            {isLoading ? 'Alterando senha...' :  'Alterar senha'}
          </Button>
        </div>
        </form>
      </div>
    </div>
  )
}