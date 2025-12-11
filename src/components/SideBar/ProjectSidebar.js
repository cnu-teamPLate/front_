import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaChevronLeft } from 'react-icons/fa'; // 아이콘 사용 (없으면 텍스트로 대체 가능)
import './ProjectSidebar.css'; 

const ProjectSidebar = ({ projectId }) => {
  const userId = localStorage.getItem('userId');
  const [isOpen, setIsOpen] = useState(true); // 사이드바 상태 관리 (기본값: 열림)

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  const sidebarLinks = [
    { path: `/assignment?projectId=${projectId}&userId=${userId}`, label: '과제' },
    { path: `/schedule?projectId=${projectId}&userId=${userId}`, label: '프로젝트 일정' },
    { path: `/project/${projectId}/MeetingLog`, label: '회의록' },
    { path: `/project/${projectId}/FileUpload`, label: '자료 업로드' },
  ];

  return (
    <>
      {/* 1. 사이드바 본체 */}
      <aside className={`project-sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
            {/* 닫기 버튼 (사이드바 내부) */}
            <button className="toggle-btn close-btn" onClick={toggleSidebar}>
                <FaChevronLeft /> 
            </button>
        </div>

        <nav>
          <ul>
            {sidebarLinks.map(link => (
              <li key={link.path}>
                <Link to={link.path}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <hr />
          <ul>
            <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer">깃허브 바로가기</a></li>
            <li><Link to="/useful-sites">팀플 유용 사이트</Link></li>
            <li><Link to="/experiences">경험담 보기</Link></li>
            <li><Link to="/meeting-rooms">우리 학교 회의실</Link></li>
          </ul>
        </nav>
      </aside>

      {/* 2. 사이드바가 닫혔을 때 나타나는 '열기 버튼' (외부) */}
      {!isOpen && (
        <button className="toggle-btn open-btn" onClick={toggleSidebar}>
            <FaBars />
        </button>
      )}
    </>
  );
};

export default ProjectSidebar;