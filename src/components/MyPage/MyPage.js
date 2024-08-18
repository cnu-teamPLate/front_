
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './MyPage.css';

function MyPage() {
  const [formData, setFormData] = useState({
    //이 부분을 백에서 저장되어있는 정보를 불러와야한다
    name: '김서강',
    email: 'abc123@sogang.ac.kr',
    studentId: '20241234',
    username: 'sogang123',
    password: 'Sogang123!',
  });
  const [editMode,setEditMode]=useState({
    name: false,
    email: false,
    studentId: false,
    username: false,
    password: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };//name과 value 추출하여 폼 필드 값 업데이트

  const toggleEditMode=(field) =>{
    setEditMode({...editMode, [field]: !editMode[field]});
  };
  return (
    <div className="MyPage">
      <header className="login-header">
        <div className="return">
          <Link to="/">홈으로 돌아가기</Link>
        </div>
      </header>
      <h1>My Page</h1>
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
              disabled={!editMode[field]}
            />
            <button type="button" onClick={() => toggleEditMode(field)}>
              {editMode[field] ? '저장하기' : '수정하기'}
            </button>
          </div>
        ))}
      </form>      <footer>
        <p>© 2024 CNU </p>
        <div className="footer-links">
          <a href="/about">About Us</a> | <a href="/contact">Contact</a> | <a href="/privacy">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}

export default MyPage;
