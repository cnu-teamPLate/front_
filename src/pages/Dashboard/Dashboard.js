import React, { useState } from 'react';
import { IoMenu, IoAddCircle, IoPerson, IoBookmark } from "react-icons/io5";
import './Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newProject, setNewProject] = useState({ topic: '', goal: '', teamMembers: [] });
  const [studentID, setStudentID] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCreateProject = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };

  const handleSearchChange = (e) => {
    setStudentID(e.target.value);
  };

  const handleSearch = () => {
    // Simulate a search result
    const results = [
      { id: '123456', name: 'John Doe' },
      { id: '654321', name: 'Jane Smith' }
    ].filter(student => student.id.includes(studentID));

    setSearchResults(results);
  };

  const handleAddTeamMember = (member) => {
    setNewProject(prevProject => ({
      ...prevProject,
      teamMembers: [...prevProject.teamMembers, member]
    }));
  };

  const handleAddProject = () => {
    setProjects([...projects, newProject]);
    setNewProject({ topic: '', goal: '', teamMembers: [] });
    setShowPopup(false);
  };

  return (
    <div className="Dashboard">
      <header className="Dashboard-header">
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
          <div className="create-project" onClick={handleCreateProject}>
            <IoAddCircle size={32} style={{ color: 'pink' }} />
            <p>프로젝트 생성하기</p>
          </div>
          <div className="my-projects">
            <h2>내 프로젝트</h2>
            {projects.map((project, index) => (
              <div className="project-item" key={index}>
                <p>{project.topic}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <main className={`App-content ${sidebarOpen ? 'shifted' : ''}`}>
        <div className="project-list">
          {projects.map((project, index) => (
            <div className="project-card" key={index}>
              <div className="project-card-header">
                <h2>{project.topic}</h2>
                <IoBookmark size={24} style={{ color: 'gold' }} />
              </div>
              <p>{project.goal}</p>
              <a href={`/project/${index}`} className="project-link">프로젝트로 이동</a>
              <div className="team-members">
                <h3>팀원:</h3>
                <ul>
                  {project.teamMembers.map((member, idx) => (
                    <li key={idx}>{member.name} ({member.id})</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showPopup && (
        <div className="popup">
          <div className="popup-inner">
            <h2>새 프로젝트 생성</h2>
            <label>
              프로젝트 주제:
              <input
                type="text"
                name="topic"
                value={newProject.topic}
                onChange={handleChange}
              />
            </label>
            <label>
              목표:
              <input
                type="text"
                name="goal"
                value={newProject.goal}
                onChange={handleChange}
              />
            </label>
            <label>
              팀원 추가:
              <input
                type="text"
                value={studentID}
                onChange={handleSearchChange}
              />
              <button onClick={handleSearch}>검색</button>
              <ul>
                {searchResults.map((result, index) => (
                  <li key={index} onClick={() => handleAddTeamMember(result)}>
                    {result.name} ({result.id})
                  </li>
                ))}
              </ul>
            </label>
            <button onClick={handleAddProject}>프로젝트 생성</button>
            <button onClick={handleClosePopup}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
