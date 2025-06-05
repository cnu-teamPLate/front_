import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleLogout = (e) => {
    e.preventDefault(); // 기본 링크 이동 막기
    localStorage.clear(); // 모든 저장 정보 제거
    navigate('/Login'); // 로그인 페이지로 이동
  };

  return (
    <header className="header">
      {/* 사이드바 토글 */}
      {toggleSidebar && (
        <button
          className="menu-btn"
          onClick={() => {
            console.log("☰ 버튼 클릭됨! 사이드바 토글 실행");
            toggleSidebar();
          }}
        >
          ☰
        </button>
      )}

      {/* 홈으로 돌아가기 */}
      <Link to="/Dashboard">홈으로 돌아가기</Link>

      {/* 로그인된 경우 */}
      {userId && (
        <>
          <Link to={`/MyPage/${userId}`} style={{ marginLeft: '20px' }}>
            마이페이지
          </Link>
          {/* 로그아웃도 링크처럼 표시 */}
          <Link
            to="#"
            onClick={handleLogout}
            style={{ marginLeft: '20px', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
          >
            로그아웃
          </Link>
        </>
      )}
    </header>
  );
};

export default Header;
