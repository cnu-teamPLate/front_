import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  return (
    <header className="header">
      {/* ✅ toggleSidebar가 있을 때만 토글 버튼 렌더링 */}
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
      <Link to="/">홈으로 돌아가기</Link>
    </header>
  );
};

export default Header;
