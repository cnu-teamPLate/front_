import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // useParams import
import "./MyPage.css";
import Footer from '../../components/Footer'; // Footer 경로 수정
import Header from '../../components/Header'; // Header 경로 수정


function MyPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    password: "",
    phone: "",
  });
  const [editMode, setEditMode] = useState(false);

  // 마이페이지 접속 시 사용자 정보 불러오기
  useEffect(() => {
    const fetchMyInfo = async () => {
      const userId = localStorage.getItem('userId');
      const accessToken = localStorage.getItem('accessToken');

      if (!userId || !accessToken) {
        alert("로그인이 필요합니다.");
        // navigate('/login'); 
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
          studentId: data.id || "",
          password: "", // 비밀번호는 보통 다시 표시하지 않습니다.
          phone: data.phone || "",
        });
      } catch (error) {
        console.error("내 정보 가져오기 오류:", error);
        alert("내 정보를 불러오지 못했습니다.");
      }
    };

    fetchMyInfo();
  }, []); // 페이지 로드 시 한 번만 실행

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdate = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      return;
    }

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
            id: formData.studentId,
            pwd: formData.password,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          }),
        }
      );

      if (response.ok) {
        alert("정보가 정상적으로 수정되었습니다.");
        setEditMode(false); // 수정 후 보기 모드로 전환
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
    if (editMode) handleUpdate(); // 수정 모드에서 저장을 클릭했을 때 업데이트
    setEditMode(!editMode); // editMode 상태 변경
  };

  return (
    <div className="MyPage">
      {/* Header 추가 */}
      <Header />

      <h1 className="title">My Page</h1>
      <form>
        {Object.keys(formData).map((field) => (
          <div className="form-group" key={field}>
            <label htmlFor={field}>
              {field === "name" && "이름"}
              {field === "email" && "이메일"}
              {field === "studentId" && "학번"}
              {field === "password" && "비밀번호"}
              {field === "phone" && "전화번호"}
            </label>
            <input
              type={field === "password" ? "password" : "text"}
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              disabled={!editMode} // editMode가 아니면 수정 불가
            />
          </div>
        ))}
        <button
          type="button"
          onClick={toggleEditMode}
          className="edit-save-button"
        >
          {editMode ? "저장하기" : "수정하기"}
        </button>
      </form>

      {/* Footer 추가 */}
      <Footer />
    </div>
  );
}

export default MyPage;
