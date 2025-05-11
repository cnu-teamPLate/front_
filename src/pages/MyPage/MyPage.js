import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';  // useParams import
import './MyPage.css';

function MyPage() {
  const { userId } = useParams();  // useParams를 통해 URL에서 userId 가져오기
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    username: '',
    password: '',
    phone: '',
  });
  const [editMode, setEditMode] = useState(false);

  // 마이페이지 접속 시 사용자 정보 불러오기
  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await fetch('https://port-0-localhost-m1w79fyl6ab28642.sel4.cloudtype.app/teamProj/auth/read-my-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: userId }),  // userId로 변경
        });

        if (!response.ok) throw new Error('정보를 불러오는 데 실패했습니다.');

        const data = await response.json();
        console.log('받아온 사용자 정보:', data);

        setFormData({
          name: data.name || '',
          email: data.mail || '',
          studentId: data.id || '',
          username: data.username || '',
          password: data.pwd || '',
          phone: data.phone || '',
        });
      } catch (error) {
        console.error('내 정보 가져오기 오류:', error);
        alert('내 정보를 불러오지 못했습니다.');
      }
    };

    if (userId) {
      fetchMyInfo();
    }
  }, [userId]);  // userId가 변경되면 다시 불러오도록 설정

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('https://port-0-localhost-m1w79fyl6ab28642.sel4.cloudtype.app/teamProj/auth/update-my-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.studentId,  // studentId로 수정
          pwd: formData.password,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          studentNumber: formData.studentId,
        }),
      });

      if (response.ok) {
        alert('정보가 정상적으로 수정되었습니다.');
      } else {
        const errorText = await response.text();
        throw new Error(errorText || '정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('정보 수정 요청 오류:', error.message);
      alert(`오류: ${error.message}`);
    }
  };

  const toggleEditMode = () => {
    if (editMode) handleUpdate();  // 수정 모드에서 저장을 클릭했을 때 업데이트
    setEditMode(!editMode);  // editMode 상태 변경
  };

  return (
    <div className="MyPage">
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
              {field === 'phone' && '전화번호'}
            </label>
            <input
              type={field === 'password' ? 'password' : 'text'}
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              disabled={!editMode}  // editMode가 아니면 수정 불가
            />
          </div>
        ))}
        <button type="button" onClick={toggleEditMode} className="edit-save-button">
          {editMode ? '저장하기' : '수정하기'}
        </button>
      </form>
    </div>
  );
}

export default MyPage;
