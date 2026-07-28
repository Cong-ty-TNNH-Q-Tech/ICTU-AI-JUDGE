import React from 'react';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage = () => {
  const { loading, loginWithGoogle } = useAuthVM();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (token: string) => {
    try {
      const userData = await loginWithGoogle(token);
      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/challenges');
      }
    } catch (e) {
      alert('Đăng nhập Google thất bại: ' + String(e));
    }
  };

  return (
    <div className="px-8 pb-8 pt-2 animate-fade-in">
      <GoogleLoginButton
        onSuccess={handleGoogleSuccess}
        loading={loading}
      />
    </div>
  );
};

export default LoginPage;
