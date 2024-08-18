import React, { useState } from 'react';
import { IoMenu, IoAddCircle, IoPerson, IoBookmark, IoSettings } from "react-icons/io5";
import './Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newProject, setNewProject] = useState({
    githubLink: '',
    goal: '',
    professorName: '',
    teamName: '',
    deadline: '',
    subject: '',
    projectName: '',
    teamMembers: [],
  });
  const [studentID, setStudentID] = useState('');

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

  const handleAddTeamMember = () => {
    const contribution = Math.floor(Math.random() * 100); 
    const newMember = {
      id: studentID,
      contribution,
      color: `rgba(188, 13, 18, ${contribution / 100})`, 
    };
    setNewProject(prevProject => ({
      ...prevProject,
      teamMembers: [...prevProject.teamMembers, newMember]
    }));
    setStudentID('');
  };

  const handleAddProject = () => {
    setProjects([...projects, newProject]);
    setNewProject({
      githubLink: '',
      goal: '',
      professorName: '',
      teamName: '',
      deadline: '',
      subject: '',
      projectName: '',
      teamMembers: [],
    });
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
                <p>{project.projectName}</p>
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
                <h2>{project.projectName}</h2>
                <div className="project-controls">
                  <IoBookmark size={24} style={{ color: 'gold' }} />
                  <IoSettings size={24} style={{ color: 'gray', cursor: 'pointer' }} />
                </div>
              </div>
              <p>{project.goal}</p>
              <a href={`/project/${index}`} className="project-link">프로젝트로 이동</a>
              <div className="team-members">
                <h3>팀원:</h3>
                <ul>
                  {project.teamMembers.map((member, idx) => (
                    <li key={idx}>
                      {member.id}
                      <div className="contribution-graph">
                        <div className="contribution-bar" style={{ width: `${member.contribution}%`, backgroundColor: member.color }}>
                          {member.contribution}%
                        </div>
                      </div>
                    </li>
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
              프로젝트명:
              <input
                type="text"
                name="projectName"
                value={newProject.projectName}
                onChange={handleChange}
              />
            </label>
            <label>
              깃허브 팀 링크:
              <input
                type="text"
                name="githubLink"
                value={newProject.githubLink}
                onChange={handleChange}
              />
            </label>
            <label>
              프로젝트 목표:
              <input
                type="text"
                name="goal"
                value={newProject.goal}
                onChange={handleChange}
              />
            </label>
            <label>
              교수님명:
              <input
                type="text"
                name="professorName"
                value={newProject.professorName}
                onChange={handleChange}
              />
            </label>
            <label>
              팀명 (추천):
              <input
                type="text"
                name="teamName"
                value={newProject.teamName}
                onChange={handleChange}
              />
            </label>
            <label>
              마감기한:
              <input
                type="date"
                name="deadline"
                value={newProject.deadline}
                onChange={handleChange}
              />
            </label>
            <label>
              과목:
              <input
                type="text"
                name="subject"
                value={newProject.subject}
                onChange={handleChange}
              />
            </label>
            <label>
              팀원 추가 (학번 입력):
              <input
                type="text"
                value={studentID}
                onChange={handleSearchChange}
              />
              <button onClick={handleAddTeamMember}>추가</button>
            </label>
            <div className="added-members">
              <h4>추가된 팀원:</h4>
              <ul>
                {newProject.teamMembers.map((member, idx) => (
                  <li key={idx}>
                    {member.id}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={handleAddProject}>프로젝트 생성</button>
            <button onClick={handleClosePopup}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
