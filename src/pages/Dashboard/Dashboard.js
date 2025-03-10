import React, { useState } from 'react';
import { IoAddCircle, IoBookmark, IoSettings, IoFlag } from "react-icons/io5";
import './Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([
    {
      githubLink: 'https://github.com/project1',
      goal: '웹 앱 개발',
      professorName: '김 교수님',
      teamName: '팀 알파',
      deadline: '2025-05-01',
      subject: '웹 개발',
      projectName: '프로젝트 하나',
      teamMembers: [
        { id: '20230001', contribution: 80, color: 'rgba(188, 13, 18, 0.8)' },
        { id: '20230002', contribution: 20, color: 'rgba(188, 13, 18, 0.2)' }
      ]
    },
    {
      githubLink: 'https://github.com/project2',
      goal: '머신러닝 모델 만들기',
      professorName: '이 교수님',
      teamName: '팀 베타',
      deadline: '2025-06-15',
      subject: '머신러닝',
      projectName: '프로젝트 두',
      teamMembers: [
        { id: '20230003', contribution: 50, color: 'rgba(188, 13, 18, 0.5)' },
        { id: '20230004', contribution: 50, color: 'rgba(188, 13, 18, 0.5)' }
      ]
    },
    {
      githubLink: 'https://github.com/project3',
      goal: '모바일 앱 개발',
      professorName: '박 교수님',
      teamName: '팀 감마',
      deadline: '2025-07-20',
      subject: '모바일 개발',
      projectName: '프로젝트 세',
      teamMembers: [
        { id: '20230005', contribution: 70, color: 'rgba(188, 13, 18, 0.7)' },
        { id: '20230006', contribution: 30, color: 'rgba(188, 13, 18, 0.3)' }
      ]
    }
  ]);
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
      <div className="create-project-btn" onClick={handleCreateProject}>
        <IoAddCircle size={30} style={{ color: '#007bff' }} />
        <p>프로젝트 생성하기</p>
      </div>

      <div className="project-list">
        {projects.map((project, index) => (
          <div className="project-card" key={index}>
            <div className="project-card-header">
              <h2>{project.projectName}</h2>
              <div className="project-controls">
                <IoFlag size={24} style={{ color: 'red', cursor: 'pointer' }} />
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

      {/* 프로젝트 생성 팝업 */}
      {showPopup && (
        <div className="popup">
          <div className="popup-inner">
            <h2>새 프로젝트 생성</h2>
            <label>
              프로젝트명:
              <input type="text" name="projectName" value={newProject.projectName} onChange={handleChange} />
            </label>
            <label>
              깃허브 팀 링크:
              <input type="text" name="githubLink" value={newProject.githubLink} onChange={handleChange} />
            </label>
            <label>
              프로젝트 목표:
              <input type="text" name="goal" value={newProject.goal} onChange={handleChange} />
            </label>
            <label>
              교수님명:
              <input type="text" name="professorName" value={newProject.professorName} onChange={handleChange} />
            </label>
            <label>
              팀명:
              <input type="text" name="teamName" value={newProject.teamName} onChange={handleChange} />
            </label>
            <label>
              마감기한:
              <input type="date" name="deadline" value={newProject.deadline} onChange={handleChange} />
            </label>
            <label>
              과목:
              <input type="text" name="subject" value={newProject.subject} onChange={handleChange} />
            </label>
            <label>
              팀원 추가 (학번 입력):
              <input type="text" value={studentID} onChange={e => setStudentID(e.target.value)} />
              <button onClick={handleAddTeamMember}>추가</button>
            </label>
            <div className="added-members">
              <h4>추가된 팀원:</h4>
              <ul>
                {newProject.teamMembers.map((member, idx) => (
                  <li key={idx}>{member.id}</li>
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
