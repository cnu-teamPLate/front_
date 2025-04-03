import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { Link } from 'react-router-dom';

import PasswordRecovery from './PasswordRecovery';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isFindingPassword, setIsFindingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true); // 로딩 시작
    setError(''); // 에러 초기화

    try {
      // 서버로 보낼 데이터
      // const body = `id=${encodeURIComponent(formData.username)}&pwd=${encodeURIComponent(formData.password)}`;
      const body = JSON.stringify({
        id: formData.username,
        pwd: formData.password,
      });


      const response = await fetch(
        'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        }
      );

      const data = await response.json(); // 서버 응답 처리

      if (response.ok) {
        // 로그인 성공
        navigate('/dashboard');
      } else {
        // 서버 에러
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setFormData({
      username: '',
      password: '',
    });
    setError('');
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleSubmit(event);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [formData]);

  const handleFindCredentials = () => {
    setIsFindingPassword(true);
  };

  const handleSignUp = () => {
    navigate('/signup'); // Navigate to the SignUp component
  };

  return (
    <div className="Login">
      <div className="login-container">
        {isFindingPassword ? (
          <PasswordRecovery onCancel={() => setIsFindingPassword(false)} />
        ) : (
          <>
            <div className="Login-box">
              <h2>로그인</h2>
              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="username">아이디</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">비밀번호</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? '로딩 중...' : '로그인'}
                </button>
              </form>
              {error && <p className="error-message">{error}</p>}
              <div className="extra-buttons">
                <button className="text-button" onClick={handleFindCredentials}>
                  비밀번호 찾기
                </button>
                <button className="text-button" onClick={handleSignUp}>
                  회원가입하기
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
