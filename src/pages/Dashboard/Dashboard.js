import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAddCircle, IoBookmark, IoSettings } from "react-icons/io5";
import './Dashboard.css';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showProjectPopup, setShowProjectPopup] = useState(false); // Fix missing state
  const [showSubjectPopup, setShowSubjectPopup] = useState(false); // Fix missing state
  const [showEditPopup, setShowEditPopup] = useState(false); // Fix missing state
  const [selectedProject, setSelectedProject] = useState(null); // Fix missing state
  const [newProject, setNewProject] = useState({
    projName: '',
    goal: '',
    github: '',
    subjectId: '',
    teamMembers: []
  });
  const navigate = useNavigate(); // Initialize useNavigate
  const [studentID, setStudentID] = useState(''); // Fix missing state
  const [subjects, setSubjects] = useState([]); // Fix missing state
  const [newTeamMemberId, setNewTeamMemberId] = useState(''); // Fix missing state

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value,
    });
  };
  const [formData, setFormData] = useState({
    id: '',
    pwd: '',
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // 로딩 시작
    setError(''); // 에러 초기화
    try {
      // 서버로 보낼 데이터
      // const body = `id=${encodeURIComponent(formData.username)}&pwd=${encodeURIComponent(formData.password)}`;
      const body = JSON.stringify({
        id: formData.username,
        pwd: formData.password,
      });


      const response = await fetch(
        'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/swagger-ui/index.html#/projects/view?userId=20241121',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: body,
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (response.ok) {
        navigate('/dashboard');
      } else {
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
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
  const handleClosePopup = () => {
    setShowPopup(false);
  };
  return (
    <div className="Dashboard">
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
