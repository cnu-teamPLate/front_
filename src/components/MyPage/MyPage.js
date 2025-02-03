import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './MyPage.css';

function MyPage() {
  const [formData, setFormData] = useState({
    name: '김서강',
    email: 'abc123@sogang.ac.kr',
    studentId: '20241234',
    username: 'sogang123',
    password: 'Sogang123!',
  });
  const [editMode, setEditMode] = useState(false); // 전체 수정 모드 관리

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdate = async () => {
    console.log('업데이트 요청 전송:', formData); // 요청 전 데이터 확인
    try {
      const response = await fetch('https://port-0-localhost-m1w79fyl6ab28642.sel4.cloudtype.app/teamProj/auth/update-my-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.username,
          pwd: formData.password,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          studentNumber: formData.studentId,
        }),
      });

      console.log('응답 상태:', response.status); // 응답 상태 코드 확인

      if (response.ok) {
        const result = await response.text();
        console.log('정보 수정 성공:', result);
        alert('정보가 정상적으로 수정되었습니다.');
      } else {
        const errorText = await response.text();
        console.error('서버 응답 오류:', errorText);
        throw new Error(errorText || '정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('정보 수정 요청 오류:', error.message);
      alert(`오류: ${error.message}`);
    }
  };


  const toggleEditMode = () => {
    if (editMode) {
      handleUpdate(); // 저장하기 버튼 클릭 시 정보 업데이트
    }
    setEditMode(!editMode); // 수정 모드 토글
  };

  return (
    <div className="MyPage">
      <header className="login-header">
        <div className="return">
          <Link to="/">홈으로 돌아가기</Link>
        </div>
      </header>
      <h1 className="title">My Page</h1>
      <form>
        {Object.keys(formData).map((field) => (
          <div className="form-group" key={field}>
            <label htmlFor={field}>
              {field === 'name' && '이름'}
              {field === 'email' && '이메일'}
              {field === 'studentId' && '학번'}
              {field === 'username' && '아이디'}
              {field === 'password' && '비밀번호'}
            </label>
            <input
              type={field === 'password' ? 'password' : 'text'}
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              disabled={!editMode} // 수정 모드일 때만 입력 가능
            />
          </div>
        ))}
        <button type="button" onClick={toggleEditMode} className="edit-save-button">
          {editMode ? '저장하기' : '수정하기'}
        </button>
      </form>
      <footer className="Mypage-footer">
        <p>© 2024 CNU </p>
        <div className="footer-links">
          <a href="/about">About Us</a> | <a href="/contact">Contact</a> | <a href="/privacy">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}

export default MyPage;
