import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

function PasswordRecovery({ onCancel }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleStudentIdChange = (e) => {
    setStudentId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/recover-password', {
        name,
        studentId,
      });
      setPassword(response.data.password);
      setError('');
    } catch (error) {
      setError('비밀번호를 찾을 수 없습니다. 이름과 학번을 확인해주세요.');
      setPassword('');
    }
  };

  return (
    <div className="password-recovery">
      <h2>비밀번호 찾기</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>이름:</label>
          <input type="text" value={name} onChange={handleNameChange} required />
        </div>
        <div>
          <label>학번:</label>
          <input type="text" value={studentId} onChange={handleStudentIdChange} required />
        </div>
        <button type="submit">비밀번호 찾기</button>
      </form>
      {password && (
        <div>
          <h2>비밀번호:</h2>
          <p>{password}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={onCancel}>뒤로가기</button>
    </div>
  );
}

export default PasswordRecovery;