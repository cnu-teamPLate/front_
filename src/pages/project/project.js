import React, { useState } from 'react';
import { IoMenu, IoPerson } from "react-icons/io5";
import { Link } from 'react-router-dom';
import './project.css';

function ProjectDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Example project data
  const project = {
    projectName: "팀 프로젝트 이름",
    teamMembers: ["팀원 1", "팀원 2", "팀원 3", "팀원 4"],
  };

  return (
    <div className="ProjectDetail">
      <header className="ProjectDetail-header">
        <div className="my-page-logout">
          <IoPerson size={24} />
          <a href="/mypage">마이페이지</a> | <a href="/logout">로그아웃</a>
        </div>
      </header>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <IoMenu size={24} />
      </button>
      <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <ul>
            <li><Link to="/Assignment">과제</Link></li>
            <li><Link to="/schedule">프로젝트 일정</Link></li>
            <li><Link to="/meeting-notes">회의록</Link></li>
            <li><Link to="/file-upload">자료 업로드</Link></li>
            <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer">깃허브 바로가기</a></li>
            <li><Link to="/useful-sites">팀플 유용 사이트 보러가기</Link></li>
            <li><Link to="/experiences">경험담 보러가기</Link></li>
            <li><Link to="/meeting-rooms">우리 학교 회의실</Link></li>
          </ul>
        </div>
      </aside>
      <main className={`App-content ${sidebarOpen ? 'shifted' : ''}`}>
        <h1>{project.projectName}</h1>
        <h2>팀원</h2>
        <ul>
          {project.teamMembers.map((member, idx) => (
            <li key={idx}>{member}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default ProjectDetail;
