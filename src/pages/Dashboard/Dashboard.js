import React, { useState } from 'react';
import { IoAddCircle, IoSettings } from "react-icons/io5";
import './Dashboard.css';

function Dashboard() {
  const [projects, setProjects] = useState([
    {
      projId: "proj001",
      subjectId: "CSE101",
      projName: "프로젝트1",
      goal: "A+ 목표",
      github: "https://github.com/example1",
      teamMembers: [
        { id: "20211001", name: "홍길동", contribution: 50, color: "rgba(0, 123, 255, 0.5)" }
      ]
    },
    {
      projId: "proj002",
      subjectId: "CSE102",
      projName: "프로젝트2",
      goal: "B 목표",
      github: "https://github.com/example2",
      teamMembers: [
        { id: "20211002", name: "김철수", contribution: 60, color: "rgba(40, 167, 69, 0.6)" }
      ]
    }
  ]);

  const [subjects, setSubjects] = useState([
    { classId: "CSE101", className: "컴퓨터 과학", professor: "강호동" },
    { classId: "CSE102", className: "알고리즘", professor: "이순신" }
  ]);

  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [showSubjectPopup, setShowSubjectPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newTeamMemberId, setNewTeamMemberId] = useState('');
  const [newProject, setNewProject] = useState({
    projName: '',
    goal: '',
    github: '',
    subjectId: '',
    teamMembers: []
  });

  // 프로젝트 생성 팝업 열기
  const handleCreateProject = () => {
    setShowProjectPopup(true);
  };

  // 과목 추가 팝업 열기
  const handleCreateSubject = () => {
    setShowSubjectPopup(true);
  };

  const handleCloseProjectPopup = () => {
    setShowProjectPopup(false);
    setNewProject({ projName: '', goal: '', github: '', subjectId: '', teamMembers: [] });
  };

  const handleCloseSubjectPopup = () => {
    setShowSubjectPopup(false);
  };

  const handleCloseEditPopup = () => {
    setShowEditPopup(false);
    setSelectedProject(null);
    setNewTeamMemberId('');
  };

  const handleAddProject = () => {
    if (!newProject.subjectId) {
      alert("수업 등록이 필요합니다.");
      return;
    }

    const newProj = {
      projId: `proj${Date.now()}`, // Unique ID for the project
      ...newProject
    };
    setProjects([...projects, newProj]);
    handleCloseProjectPopup();
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditPopup(true);
  };

  const handleSearchChange = (e) => {
    setNewTeamMemberId(e.target.value);
  };

  const handleAddTeamMember = () => {
    const memberToAdd = { id: newTeamMemberId, name: `학생${newTeamMemberId}`, contribution: 50, color: "rgba(0, 123, 255, 0.5)" };
    const updatedProject = { ...selectedProject, teamMembers: [...selectedProject.teamMembers, memberToAdd] };
    setSelectedProject(updatedProject);
    setNewTeamMemberId('');
  };

  const handleSaveProject = () => {
    const updatedProjects = projects.map((project) =>
      project.projId === selectedProject.projId ? selectedProject : project
    );
    setProjects(updatedProjects);
    handleCloseEditPopup();
  };

  const handleAddSubject = (newSubject) => {
    setSubjects([...subjects, newSubject]);
    handleCloseSubjectPopup();
  };

  return (
    <div className="Dashboard">
      <main className="App-content">
        <div className="btnContainer">
        <button onClick={handleCreateProject} className="btn-add-project">
          프로젝트 추가
        </button>
        <button onClick={handleCreateSubject} className="btn-add-subject">
          과목 추가
        </button>
        </div>     

        <div className="project-list">
          {projects.map((project) => (
            <div className="project-card" key={project.projId}>
              <div className="project-card-header">
                <h2>{project.projName}</h2>
                <div className="project-controls">
                  <IoSettings size={20} onClick={() => handleEditProject(project)} />
                </div>
              </div>
              <p>{project.goal}</p>
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">GitHub 링크</a>
              <div className="team-members">
                <p><strong>팀원:</strong></p>
                <ul>
                  {project.teamMembers.map((member, idx) => (
                    <li key={idx}>{member.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 프로젝트 추가 팝업 */}
      {showProjectPopup && (
        <div className="popup">
          <div className="popup-inner">
            <h2>프로젝트 추가</h2>
            <input
              type="text"
              value={newProject.projName}
              onChange={(e) => setNewProject({ ...newProject, projName: e.target.value })}
              placeholder="프로젝트 이름"
            />
            <input
              type="text"
              value={newProject.goal}
              onChange={(e) => setNewProject({ ...newProject, goal: e.target.value })}
              placeholder="목표"
            />
            <input
              type="text"
              value={newProject.github}
              onChange={(e) => setNewProject({ ...newProject, github: e.target.value })}
              placeholder="GitHub 링크"
            />
            <select
              value={newProject.subjectId}
              onChange={(e) => setNewProject({ ...newProject, subjectId: e.target.value })}
            >
              <option value="">과목 선택</option>
              {subjects.map((subject, idx) => (
                <option key={idx} value={subject.classId}>{subject.className}</option>
              ))}
            </select>
            <button onClick={handleAddProject}>프로젝트 추가</button>
            <button onClick={handleCloseProjectPopup}>닫기</button>
          </div>
        </div>
      )}

      {/* 과목 추가 팝업 */}
      {showSubjectPopup && (
        <div className="popup">
          <div className="popup-inner">
            <h2>과목 추가</h2>
            <input
              type="text"
              placeholder="과목 ID"
              onChange={(e) => setNewProject({ ...newProject, subjectId: e.target.value })}
            />
            <input
              type="text"
              placeholder="과목 이름"
              onChange={(e) => setNewProject({ ...newProject, projName: e.target.value })}
            />
            <input
              type="text"
              placeholder="교수님 이름"
              onChange={(e) => setNewProject({ ...newProject, professor: e.target.value })}
            />
            <button onClick={() => handleAddSubject(newProject)}>과목 추가</button>
            <button onClick={handleCloseSubjectPopup}>닫기</button>
          </div>
        </div>
      )}

      {/* 프로젝트 수정 팝업 */}
      {showEditPopup && selectedProject && (
        <div className="popup">
          <div className="popup-inner">
            <h2>프로젝트 수정</h2>
            <input
              type="text"
              value={selectedProject.projName}
              onChange={(e) => setSelectedProject({ ...selectedProject, projName: e.target.value })}
              placeholder="프로젝트 이름"
            />
            <input
              type="text"
              value={selectedProject.goal}
              onChange={(e) => setSelectedProject({ ...selectedProject, goal: e.target.value })}
              placeholder="목표"
            />
            <input
              type="text"
              value={selectedProject.github}
              onChange={(e) => setSelectedProject({ ...selectedProject, github: e.target.value })}
              placeholder="GitHub 링크"
            />
            
            {/* 팀원 추가 */}
            <input
              type="text"
              value={newTeamMemberId}
              onChange={handleSearchChange}
              placeholder="학생 ID로 팀원 추가"
            />
            <button onClick={handleAddTeamMember}>팀원 추가</button>
            <ul>
              {selectedProject.teamMembers.map((member, idx) => (
                <li key={idx}>{member.name}</li>
              ))}
            </ul>
            
            <button onClick={handleSaveProject}>저장</button>
            <button onClick={handleCloseEditPopup}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
