import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAddCircle, IoBookmark, IoSettings } from "react-icons/io5";
import './Dashboard.css';

const API_BASE_URL = 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState(initialProject());
  const [studentID, setStudentID] = useState(''); // For team members
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // States for Subject Search and Enrollment
  const [subjectNameInput, setSubjectNameInput] = useState(''); // Input for subject name search
  const [searchedSubject, setSearchedSubject] = useState(null); // Stores result from GET /class/name/{className}
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollClassIdInput, setEnrollClassIdInput] = useState('');
  const [enrollProfessorInput, setEnrollProfessorInput] = useState('');
  const [subjectApiMessage, setSubjectApiMessage] = useState('');

  function initialProject() {
    return {
      projectName: '',
      goal: '',
      githubLink: '',
      subject: null, // Will store { classId, className, professor }
      teamMembers: []
    };
  }

  // Function to reset subject-related states
  const resetSubjectStates = () => {
    setSubjectNameInput('');
    setSearchedSubject(null);
    setShowEnrollForm(false);
    setEnrollClassIdInput('');
    setEnrollProfessorInput('');
    setSubjectApiMessage('');
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        // Assuming userId is hardcoded for now as in the original code
        const response = await fetch(`${API_BASE_URL}/projects/view?userId=20241121`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
          throw new Error(errorData.message || '프로젝트 데이터를 불러오는 데 실패했습니다.');
        }
        const data = await response.json();
        const projectsWithMembers = data.map(project => ({
          ...project,
          teamMembers: project.teamMembers || []
        }));
        setProjects(projectsWithMembers);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentIDChange = (e) => {
    setStudentID(e.target.value);
  };

  const handleAddTeamMember = () => {
    if (!studentID.trim()) {
      alert('학번을 입력해주세요.');
      return;
    }
    const contribution = Math.floor(Math.random() * 100); // Example contribution
    const newMember = {
      id: studentID,
      contribution,
      color: `rgba(188, 13, 18, ${contribution / 100})`
    };
    setNewProject(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, newMember]
    }));
    setStudentID('');
  };

  const handleCreateProject = () => {
    setNewProject(initialProject());
    resetSubjectStates(); // Reset subject states when opening popup
    setShowProjectPopup(true);
  };

  const handleCloseProjectPopup = () => {
    setShowProjectPopup(false);
    setNewProject(initialProject()); // Reset project form
    resetSubjectStates(); // Also reset subject states on close
  };

  const handleAddProject = () => {
    // Validate that a subject has been selected or enrolled
    if (!newProject.subject) {
      alert("과목을 조회하여 선택하거나 새로 등록해주세요.");
      setSubjectApiMessage("과목을 조회하여 선택하거나 새로 등록해주세요."); // Show message in the designated area
      return;
    }
    if (!newProject.projectName) { // Example: also validate project name
        alert("프로젝트 명을 입력해주세요.");
        return;
    }
    // In a real app, you would send this to the backend.
    // For now, adding to local state with a temporary ID.
    const newProjWithId = { ...newProject, projId: `proj${Date.now()}` };
    setProjects(prev => [...prev, newProjWithId]);
    console.log("Creating project with subject:", newProject.subject);
    handleCloseProjectPopup();
  };

  // --- Subject Search and Enrollment Handlers ---
  const handleSearchSubject = async () => {
    if (!subjectNameInput.trim()) {
      setSubjectApiMessage('검색할 과목명을 입력해주세요.');
      return;
    }
    setSubjectApiMessage('과목 조회 중...');
    setSearchedSubject(null);
    setShowEnrollForm(false);

    try {
      const response = await fetch(`${API_BASE_URL}/class/name/${encodeURIComponent(subjectNameInput.trim())}`);

      // 1. 404 Not Found 응답을 가장 먼저 명시적으로 처리
      if (response.status === 404) {
        let serverMessage = "404 - 해당 리소스를 찾을 수 없습니다."; // 기본 404 메시지
        try {
          // 404 응답에도 본문이 있을 수 있으므로 텍스트로 읽어보려 시도
          const errorText = await response.text();
          if (errorText && errorText.trim() !== "") {
            serverMessage = errorText.trim();
          }
        } catch (textErr) {
          console.warn("404 응답에서 텍스트 본문을 읽는 중 오류 발생:", textErr);
        }
        setSubjectApiMessage(`'${subjectNameInput.trim()}' 과목을 찾을 수 없습니다. (서버: ${serverMessage}). 새로 등록하시겠습니까?`);
        setShowEnrollForm(true);
        setEnrollClassIdInput(subjectNameInput.trim()); // 새 과목 ID로 현재 입력값 제안
        setEnrollProfessorInput(''); // 교수명은 새로 입력하도록 초기화
        return; // 여기서 함수 실행을 중단합니다.
      }

      // 2. 그 외 다른 HTTP 오류 응답 처리 (404가 아닌 4xx, 5xx 등)
      if (!response.ok) {
        let errorMessage = `HTTP 오류! 상태: ${response.status}`;
        const contentType = response.headers.get("content-type");
        try {
          if (contentType && contentType.includes("application/json")) {
            // 오류 응답이 JSON 형식일 경우 파싱 시도
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage;
          } else {
            // JSON이 아닐 경우 텍스트로 읽음
            const errorText = await response.text();
            errorMessage = errorText.trim() || errorMessage;
          }
        } catch (e) {
          // 오류 응답 본문 파싱 실패 시 (예: JSON 파싱 에러)
          console.warn("오류 응답의 본문을 파싱할 수 없습니다:", e);
          // errorMessage는 이미 'HTTP 오류! 상태: ...'로 설정되어 있음
        }
        setSubjectApiMessage(`과목 조회 실패: ${errorMessage}`);
        setShowEnrollForm(false); // 일반적인 오류 시에는 등록 양식 숨김
        return; // 여기서 함수 실행을 중단합니다.
      }

      // 3. 응답이 성공적인 경우 (response.ok === true, 즉 2xx 상태 코드)
      //    이 시점에서는 응답 본문이 JSON일 것으로 기대합니다 (API 명세에 따라).
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const responseData = await response.json(); // 성공 응답이므로 JSON 파싱 시도

        if (responseData && responseData.length > 0) {
          // 과목을 찾았고, 데이터가 있는 경우
          setSearchedSubject(responseData[0]);
          setSubjectApiMessage(`과목을 찾았습니다: ${responseData[0].className} (교수: ${responseData[0].professor || 'N/A'})`);
          setShowEnrollForm(false);
        } else {
          // 200 OK 응답이지만, 데이터가 없는 경우 (예: 빈 배열 []) -> "과목 없음"으로 간주
          setSubjectApiMessage('해당 과목 정보를 찾을 수 없습니다. 새로 등록하시겠습니까?');
          setShowEnrollForm(true);
          setEnrollClassIdInput(subjectNameInput.trim());
          setEnrollProfessorInput('');
        }
      } else {
        // 200 OK 응답이지만, Content-Type이 JSON이 아니거나 없는 경우
        const responseText = await response.text(); // 실제 응답 내용 확인 (디버깅용)
        console.warn("올바른 HTTP 응답(2xx)을 받았으나 JSON 형식이 아닙니다. 응답 내용:", responseText);
        setSubjectApiMessage('과목 정보를 찾을 수 없거나 서버 응답 형식이 올바르지 않습니다. 새로 등록하시겠습니까?');
        setShowEnrollForm(true);
        setEnrollClassIdInput(subjectNameInput.trim());
        setEnrollProfessorInput('');
      }

    } catch (err) {
      // 네트워크 오류 (fetch 자체가 실패한 경우) 또는 위의 await 작업 중 발생한 예외
      console.error("Search subject error:", err);
      setSubjectApiMessage('과목 조회 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      setShowEnrollForm(false);
    }
  };

  // handleSelectSubject 함수는 제공해주신 내용 그대로 사용합니다.
  const handleSelectSubject = () => {
    if (searchedSubject) {
      setNewProject(prev => ({ ...prev, subject: searchedSubject }));
      setSubjectApiMessage(`선택된 과목: ${searchedSubject.className}`);
      // Clear search input and results after selection
      // setSubjectNameInput(''); // Optional: clear input
      setSearchedSubject(null);
      setShowEnrollForm(false);
    }
  };

  // handleEnrollSubject 함수는 제공해주신 내용 그대로 사용합니다.
  const handleEnrollSubject = async () => {
    if (!enrollClassIdInput.trim() || !subjectNameInput.trim() || !enrollProfessorInput.trim()) {
      setSubjectApiMessage('과목 ID, 과목명, 교수명을 모두 입력해주세요.');
      return;
    }
    setSubjectApiMessage('새 과목 등록 중...');

    const newClassData = {
      classId: enrollClassIdInput.trim(),
      className: subjectNameInput.trim(), // The original searched name is the className
      professor: enrollProfessorInput.trim()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/class/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClassData)
      });

      const responseText = await response.text();

      if (response.ok) {
        setSubjectApiMessage(`성공: ${responseText}`);
        setNewProject(prev => ({ ...prev, subject: newClassData }));
        setShowEnrollForm(false);
        setSearchedSubject(null); 
      } else {
        setSubjectApiMessage(`등록 실패: ${responseText}`);
      }
    } catch (err) {
      console.error("Enroll subject error:", err);
      setSubjectApiMessage('과목 등록 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
    }
  };


  const handleEditProject = (project) => {
    setSelectedProject({ ...project });
    setShowEditPopup(true);
  };

  const handleSaveProject = () => {
    setProjects(prev =>
      prev.map(p => (p.projId === selectedProject.projId ? selectedProject : p))
    );
    setShowEditPopup(false);
    setSelectedProject(null);
  };

  return (
    <div className="Dashboard">
      <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="my-projects">
            <h2>내 프로젝트</h2>
            {projects.map(project => (
              <div className="project-item" key={project.projId} onClick={() => navigate(`/project/${project.projId}`)} style={{ cursor: 'pointer' }}>
                <p>{project.projectName}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className={`App-content ${sidebarOpen ? 'shifted' : ''}`}>
        <div className="main-header">
          <button onClick={handleCreateProject} className="add-project-button">
            <IoAddCircle size={20} style={{ marginRight: '8px' }} />
            새 프로젝트 추가
          </button>
        </div>

        {isLoading ? (
          <p>로딩 중...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="project-list">
            {projects.map(project => (
              <div className="project-card" key={project.projId}>
                <div className="project-card-header">
                  <h2>{project.projectName}</h2>
                  <div className="project-controls">
                    <IoBookmark size={24} color="gold" />
                    <IoSettings
                      size={24}
                      color="gray"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleEditProject(project)}
                    />
                  </div>
                </div>
                <p><strong>목표:</strong> {project.goal || 'N/A'}</p>
                <p><strong>과목:</strong> {project.subject ? `${project.subject.className} (${project.subject.professor || 'N/A'})` : 'N/A'}</p>
                <a href={`/project/${project.projId}`} className="project-link">프로젝트로 이동</a>
                <div className="team-members">
                  <h3>팀원:</h3>
                  {project.teamMembers && project.teamMembers.length > 0 ? (
                    <ul>
                      {project.teamMembers.map((member) => (
                        <li key={member.id}>
                          {member.id}
                          <div className="contribution-graph">
                            <div
                              className="contribution-bar"
                              style={{ width: `${member.contribution}%`, backgroundColor: member.color || `rgba(188, 13, 18, ${member.contribution / 100})` }}
                            >
                              {member.contribution}%
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>팀원이 없습니다.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 새 프로젝트 생성 팝업 */}
      {showProjectPopup && (
        <div className="popupfordashboard">
          <div className="popup-inner">
            <h2>새 프로젝트 생성</h2>
            <label>프로젝트명:
              <input type="text" name="projectName" value={newProject.projectName} onChange={handleChange} />
            </label>
            <label>깃허브 팀 링크 (선택 사항):
              <input type="text" name="githubLink" value={newProject.githubLink} onChange={handleChange} />
            </label>
            <label>프로젝트 목표:
              <input type="text" name="goal" value={newProject.goal} onChange={handleChange} />
            </label>

            {/* --- 과목 검색 및 등록 UI --- */}
            <div className="subject-section">
              <label htmlFor="subjectNameInputId">과목명:</label>
              <div className="subject-search-container">
                <input
                  id="subjectNameInputId"
                  type="text"
                  value={subjectNameInput}
                  onChange={(e) => setSubjectNameInput(e.target.value)}
                  placeholder="과목명 입력 후 조회"
                />
                <button type="button" onClick={handleSearchSubject} className="search-subject-button">조회</button>
              </div>

              {subjectApiMessage && <p className={`api-message ${showEnrollForm ? 'enroll-prompt' : ''}`}>{subjectApiMessage}</p>}

              {searchedSubject && !showEnrollForm && (
                <div className="subject-found-details">
                  <p><strong>검색된 과목:</strong> {searchedSubject.className} (교수: {searchedSubject.professor || 'N/A'})</p>
                  <button type="button" onClick={handleSelectSubject} className="select-subject-button">이 과목 선택</button>
                </div>
              )}

              {showEnrollForm && (
                <div className="subject-enroll-form">
                  <h4>새 과목 등록</h4>
                  <label>과목 ID (필수):
                    <input
                      type="text"
                      value={enrollClassIdInput}
                      onChange={(e) => setEnrollClassIdInput(e.target.value)}
                      placeholder="새 과목의 고유 ID (예: 과목명)"
                    />
                  </label>
                  <label>과목명 (자동 입력됨):
                    <input
                      type="text"
                      value={subjectNameInput}
                      readOnly 
                      disabled
                      style={{backgroundColor: '#e9ecef'}}
                    />
                  </label>
                  <label>교수명 (필수):
                    <input
                      type="text"
                      value={enrollProfessorInput}
                      onChange={(e) => setEnrollProfessorInput(e.target.value)}
                      placeholder="교수님 성함"
                    />
                  </label>
                  <button type="button" onClick={handleEnrollSubject} className="enroll-subject-button">이 내용으로 등록</button>
                </div>
              )}
            </div>
            {/* --- END 과목 검색 및 등록 UI --- */}
            <hr className="divider" />
            <label>팀원 추가 (학번 입력):
              <div className="team-member-input-group">
                <input type="text" value={studentID} onChange={handleStudentIDChange} placeholder="예: 20240001" />
                <button onClick={handleAddTeamMember} className="add-member-button-popup">추가</button>
              </div>
            </label>
            <div className="added-members">
              <h4>추가된 팀원:</h4>
              {newProject.teamMembers.length > 0 ? (
                <ul>
                  {newProject.teamMembers.map((member, idx) => (
                    <li key={idx}>{member.id} (기여도: {member.contribution}%)</li>
                  ))}
                </ul>
              ) : (
                <p>추가된 팀원이 없습니다.</p>
              )}
            </div>
            <div className="popup-actions">
              <button onClick={handleAddProject} className="popup-create-button">프로젝트 생성</button>
              <button onClick={handleCloseProjectPopup} className="popup-cancel-button">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 편집 팝업 */}
      {showEditPopup && selectedProject && (
        <div className="popupfordashboard">
          <div className="popup-inner">
            <h2>프로젝트 편집</h2>
            <label>프로젝트명:
              <input
                type="text"
                value={selectedProject.projectName}
                onChange={e =>
                  setSelectedProject({ ...selectedProject, projectName: e.target.value })
                }
              />
            </label>
            <label>프로젝트 목표:
              <input
                type="text"
                value={selectedProject.goal}
                onChange={e =>
                  setSelectedProject({ ...selectedProject, goal: e.target.value })
                }
              />
            </label>
            {/* Note: Editing subject for an existing project might need more complex UI/logic */}
            <div className="popup-actions">
              <button onClick={handleSaveProject} className="popup-save-button">저장</button>
              <button onClick={() => { setShowEditPopup(false); setSelectedProject(null); }} className="popup-cancel-button">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;