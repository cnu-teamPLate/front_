import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import PasswordRecovery from './PasswordRecovery';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isFindingPassword, setIsFindingPassword] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.username && formData.password) {
      setError('');
      navigate('/dashboard'); // Redirect to Dashboard after successful login
    } else {
      setError('아이디와 비밀번호를 입력해주세요.');
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
      <header className="login-header">
      </header>
      <div className="login-container">
        {isFindingPassword ? (
          <PasswordRecovery onCancel={() => setIsFindingPassword(false)} />
        ) : (
          <>
            <div className='Login-box'>
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
                <button type="submit">로그인</button>
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
      <footer>
        <p>© 2024 CNU</p>
        <div className="footer-links">
          <a href="/about">About Us</a> | <a href="/contact">Contact</a> | <a href="/privacy">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}

export default Login;
