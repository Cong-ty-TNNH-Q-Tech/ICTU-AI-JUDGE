import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface GoogleLoginButtonProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  loading?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  loading = false,
}) => {
  return (
    <div className={`w-full flex justify-center ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            onSuccess(credentialResponse.credential);
          }
        }}
        onError={() => {
          if (onError) {
            onError('Lỗi đăng nhập Google');
          }
        }}
        useOneTap
        shape="rectangular"
        theme="outline"
        size="large"
        width="100%"
        text="continue_with"
      />
    </div>
  );
};

export default GoogleLoginButton;
