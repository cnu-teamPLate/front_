import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

function PasswordRecovery({ onCancel }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        'https://teamplate-api.site/auth/send-password-mail',
        { email }
      );

      if (response.status === 200) {
        setMessage('비밀번호 재설정 이메일이 전송되었습니다.');
        setError('');
      }
    } catch (err) {
      setError('이메일 전송에 실패했습니다. 올바른 이메일인지 확인해주세요.');
      setMessage('');
    }
  };

  return (
    <div className="password-recovery">
      <h2>비밀번호 찾기</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label style={{ marginLeft: '10px' }}>이메일:</label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </div>
        <button type="submit">이메일 발송</button>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <button onClick={onCancel}>뒤로가기</button>
    </div>
  );
}

export default PasswordRecovery;
