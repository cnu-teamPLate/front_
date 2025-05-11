import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const userId = localStorage.getItem('userId') // 로컬 스토리지에서 userId 불러오기

  return (
    <header className="header">
      {/* 사이드바 토글 버튼 */}
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

      {/* 로그인된 경우에만 마이페이지 버튼 표시 */}
      {userId && (
        <Link to={`/MyPage/${userId}`} style={{ marginLeft: '20px' }}>
          마이페이지
        </Link>
      )}
    </header>
  );
};

export default Header;
