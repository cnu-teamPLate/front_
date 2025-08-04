import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoHome, IoLogOutOutline, IoSettings } from "react-icons/io5";

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate('/Login');
  };

  return (
    <header className="header">
      <Link to="/Dashboard"  
      style={{
      position: "absolute", 
      left: "20px", 
      top: "20px", 
  }}><IoHome size={30} color='white'/></Link>

      {userId && (
        <>
          <Link to={`/MyPage/${userId}`} style={{position: "absolute", right: '70px', top:"24px", }}>
            <IoSettings size={26} color='white'/>
          </Link>
          {/* 로그아웃도 링크처럼 표시 */}
          <Link
            to="#"
            onClick={handleLogout}
            style={{ position: "absolute",right: '20px', top:"22px" }}
          >
            <IoLogOutOutline size={30} color='white' />
          </Link>
        </>
      )}
    </header>
  );
};

export default Header;
