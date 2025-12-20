import React, { useState, useEffect } from "react";
import "./MyPage.css";
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import '../../style/variables.css';
import '../../style/modern-theme-overhaul.css';

function MyPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    password: "", // 비밀번호 변경을 위해 상태 관리 (초기값 빈 문자열)
    phone: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // 마이페이지 접속 시 사용자 정보 불러오기
  useEffect(() => {
    const fetchMyInfo = async () => {
      const userId = localStorage.getItem('userId');
      const accessToken = localStorage.getItem('accessToken');

      if (!userId || !accessToken) {
        alert("로그인이 필요합니다.");
        window.location.href = '/login'; // 리다이렉트
        return;
      }

      try {
        const response = await fetch(
          `https://teamplate-api.site/auth/read-my-info?userId=${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) throw new Error("정보를 불러오는 데 실패했습니다.");

        const data = await response.json();
        console.log("받아온 사용자 정보:", data);

        setFormData({
          name: data.username || "",
          email: data.email || "",
          studentId: data.id || userId,
          password: "", // 보안상 기존 비밀번호는 불러오지 않고 비워둡니다.
          phone: data.phone || "",
        });
      } catch (error) {
        console.error("내 정보 가져오기 오류:", error);
        alert("내 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyInfo();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdate = async () => {
    const accessToken = localStorage.getItem('accessToken');
    
    // 유효성 검사 (이메일, 전화번호)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;

    if (!emailRegex.test(formData.email)) {
        alert("올바른 이메일 형식이 아닙니다.");
        return;
    }
    if (!phoneRegex.test(formData.phone)) {
        alert("올바른 전화번호 형식이 아닙니다.");
        return;
    }

    // 비밀번호 입력 확인 (수정 모드인데 비밀번호가 비어있으면 경고를 띄울지, 아니면 기존 비번 유지를 위해 빈값으로 보낼지 결정 필요)
    // 여기서는 사용자가 비밀번호 필드를 비워두면 백엔드에서 처리가 필요하거나, 
    // 혹은 '비밀번호를 입력해주세요'라고 강제할 수 있습니다. 
    // 현재 로직: 입력된 값이 있으면 전송.
    
    try {
      const response = await fetch(
        "https://teamplate-api.site/auth/update-my-info",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            id: formData.studentId, // 학번 (식별자용)
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            pwd: formData.password // [수정됨] 사용자가 입력한 새 비밀번호 전송
          }),
        }
      );

      if (response.ok) {
        alert("정보가 정상적으로 수정되었습니다.");
        setEditMode(false);
        // 수정 후 비밀번호 필드 다시 비우기 (선택사항)
        setFormData(prev => ({ ...prev, password: "" }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("정보 수정 요청 오류:", error.message);
      alert(`오류: ${error.message}`);
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
        handleUpdate(); // 저장 모드면 업데이트 실행
    } else {
        setEditMode(true); // 수정 모드로 진입
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="MyPage">
      <Header />
      <div className="mypage-container">
        
        <form className="mypage-form" onSubmit={(e) => e.preventDefault()}>
          <h1 className="title">My Page</h1>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentId">학번</label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={formData.studentId}
              disabled={true} /* 학번은 항상 수정 불가 */
              className="read-only-field"
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
              disabled={!editMode} /* [수정됨] 수정 모드일 때 입력 가능 */
              placeholder={editMode ? "변경할 비밀번호를 입력하세요" : "********"}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">전화번호</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>

          <button
            type="button"
            onClick={toggleEditMode}
            className="edit-save-button"
          >
            {editMode ? "저장하기" : "수정하기"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default MyPage;