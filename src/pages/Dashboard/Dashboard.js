import React, { useState, useEffect, useCallback } from 'react'; // useCallback 유지
import { useNavigate } from 'react-router-dom'; // useParams 제거
import { IoAddCircle, IoBookmark, IoSettings } from "react-icons/io5";
import { Link } from 'react-router-dom';

import './Dashboard.css';

const API_BASE_URL = 'https://www.teamplate-api.site';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(5);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState(initialProject());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const userIdFromStorage = localStorage.getItem('userId'); // 문자열 또는 null

  // Subject Search and Enrollment States
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [searchedSubject, setSearchedSubject] = useState(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollClassIdInput, setEnrollClassIdInput] = useState('');
  const [enrollProfessorInput, setEnrollProfessorInput] = useState('');
  const [subjectApiMessage, setSubjectApiMessage] = useState('');

  // Team Member Search and Addition States
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchedMembers, setSearchedMembers] = useState([]);
  const [memberApiMessage, setMemberApiMessage] = useState('');

  function initialProject() {
    return {
      projectName: '',
      goal: '',
      githubLink: '',
      subject: null,
      teamName: '',
      teamMembers: [],
      date: new Date().toISOString(),
    };
  }

  const resetPopupFormStates = () => {
    setSubjectNameInput('');
    setSearchedSubject(null);
    setShowEnrollForm(false);
    setEnrollClassIdInput('');
    setEnrollProfessorInput('');
    setSubjectApiMessage('');
    setMemberSearchQuery('');
    setSearchedMembers([]);
    setMemberApiMessage('');
  };

  const fetchProjects = useCallback(async () => {
    // !!! localStorage에서 가져온 userIdFromStorage 사용 !!!
    if (!userIdFromStorage) {
      console.warn("User ID from localStorage is not available. Skipping fetchProjects.");
      setIsLoading(false);
      setError("사용자 ID를 찾을 수 없어 프로젝트를 불러올 수 없습니다. 로그인 상태를 확인해주세요.");
      setProjects([]); // 사용자 ID가 없으면 프로젝트 목록을 비웁니다.
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/projects/view?userId=${userIdFromStorage}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from server' }));
        throw new Error(errorData.message || '프로젝트 데이터를 불러오는 데 실패했습니다.');
      }
      const dataFromApi = await response.json();

      const mappedProjects = dataFromApi.map((projectFromApi, index) => {
        const teamMembers = (projectFromApi.teamones || []).map(apiMember => ({
          id: apiMember.userId,
          name: apiMember.userName,
        }));
        const projId = projectFromApi.projectId || projectFromApi.projId || `${projectFromApi.classId}-${projectFromApi.projName}-${projectFromApi.date || index}`;
        let subjectData = null;
        if (projectFromApi.classId) {
          subjectData = {
            classId: projectFromApi.classId,
            className: projectFromApi.className || projectFromApi.subjectName || projectFromApi.classId,
            professor: projectFromApi.professor || projectFromApi.professorName || '',
          };
        }
        return {
          projId: projId,
          projectName: projectFromApi.projName,
          goal: projectFromApi.goal,
          githubLink: projectFromApi.githubLink || projectFromApi.github,
          date: projectFromApi.date || new Date().toISOString(),
          subject: subjectData,
          classId: projectFromApi.classId,
          teamName: projectFromApi.teamName,
          teamMembers: teamMembers,
        };
      });
      setProjects(mappedProjects);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userIdFromStorage]); // userIdFromStorage가 변경될 때 fetchProjects 함수 재생성

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // fetchProjects (즉, userIdFromStorage)가 변경될 때 실행

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

  const paginate = pageNumber => setCurrentPage(pageNumber);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setSelectedProject(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberSearchQueryChange = (e) => {
    setMemberSearchQuery(e.target.value);
  };

  const handleCreateProject = () => {
    setNewProject(initialProject());
    resetPopupFormStates();
    setShowProjectPopup(true);
  };

  const handleCloseProjectPopup = () => {
    setShowProjectPopup(false);
    setNewProject(initialProject());
    resetPopupFormStates();
  };

  const handleAddProject = async () => {
    if (!newProject.projectName.trim()) { alert("프로젝트 명을 입력해주세요."); return; }
    if (!newProject.subject || !newProject.subject.classId) { alert("과목을 선택하거나 등록해주세요."); setSubjectApiMessage("과목을 선택하거나 등록해주세요."); return; }
    if (!newProject.teamName.trim()) { alert("팀 이름을 입력해주세요."); return; }

    // 현재 로그인 유저를 팀원 목록에 자동 포함
    let teamMembers = [...newProject.teamMembers];
    if (userIdFromStorage && !teamMembers.some(member => member.id === userIdFromStorage)) {
      teamMembers.push({ id: userIdFromStorage, name: userIdFromStorage });
    }
    const projectPayload = {
      date: newProject.date || new Date().toISOString(),
      goal: newProject.goal,
      projName: newProject.projectName,
      github: newProject.githubLink,
      classId: newProject.subject.classId,
      teamName: newProject.teamName,
      members: teamMembers.map(member => member.id)
    };

    console.log("Submitting project payload for creation:", projectPayload);
    setIsSubmitting(true);
    setSubjectApiMessage(''); setMemberApiMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projectPayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}. 서버 응답을 파싱할 수 없습니다.` }));
        throw new Error(errorData.message || `프로젝트 생성에 실패했습니다. 상태: ${response.status}`);
      }
      const responseData = await response.json();
      let finalMessage = responseData.message || '프로젝트가 성공적으로 처리되었습니다.';
      if (responseData.failedMemberIds && responseData.failedMemberIds.length > 0) {
        finalMessage = `프로젝트는 처리되었으나, 다음 학번의 팀원 추가에 실패했습니다: ${responseData.failedMemberIds.join(', ')}. 목록을 확인해주세요.`;
      }
      alert(finalMessage);
      fetchProjects();
      handleCloseProjectPopup();
    } catch (submissionError) {
      console.error("Failed to submit project:", submissionError); alert(`프로젝트 추가 중 오류 발생: ${submissionError.message}`);
    } finally { setIsSubmitting(false); }
  };

  const handleSearchSubject = async () => {
    if (!subjectNameInput.trim()) { setSubjectApiMessage('검색할 과목명을 입력해주세요.'); return; }
    setSubjectApiMessage('과목 조회 중...'); setSearchedSubject(null); setShowEnrollForm(false);
    try {
      const response = await fetch(`${API_BASE_URL}/class/name/${encodeURIComponent(subjectNameInput.trim())}`);
      if (response.status === 404) {
        let serverMessage = "404 - 해당 리소스를 찾을 수 없습니다.";
        try { const errorText = await response.text(); if (errorText && errorText.trim() !== "") serverMessage = errorText.trim(); } catch (textErr) { console.warn("404 응답에서 텍스트 본문을 읽는 중 오류 발생:", textErr); }
        setSubjectApiMessage(`'${subjectNameInput.trim()}' 과목을 찾을 수 없습니다. (서버: ${serverMessage}). 새로 등록하시겠습니까?`); setShowEnrollForm(true); setEnrollClassIdInput(subjectNameInput.trim()); setEnrollProfessorInput(''); return;
      }
      if (!response.ok) {
        let errorMessage = `HTTP 오류! 상태: ${response.status}`; const contentType = response.headers.get("content-type");
        try { if (contentType && contentType.includes("application/json")) { const errorData = await response.json(); errorMessage = errorData.message || errorData.error || JSON.stringify(errorData) || errorMessage; } else { const errorText = await response.text(); errorMessage = errorText.trim() || errorMessage; } } catch (e) { console.warn("오류 응답의 본문을 파싱할 수 없습니다:", e); }
        if (response.status === 400) {
          setSubjectApiMessage(`입력값을 확인해주시거나, 과목을 찾을 수 없습니다. (서버 응답: ${errorMessage}). 새로 등록하시겠습니까?`); setShowEnrollForm(true); setEnrollClassIdInput(subjectNameInput.trim()); setEnrollProfessorInput('');
        } else { setSubjectApiMessage(`과목 조회 실패: ${errorMessage}`); setShowEnrollForm(false); } return;
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const responseData = await response.json();
        if (responseData && responseData.length > 0) {
          setSearchedSubject(responseData[0]); setSubjectApiMessage(`과목을 찾았습니다: ${responseData[0].className} (교수: ${responseData[0].professor || 'N/A'})`); setShowEnrollForm(false);
        } else { setSubjectApiMessage('해당 과목 정보를 찾을 수 없습니다. 새로 등록하시겠습니까?'); setShowEnrollForm(true); setEnrollClassIdInput(subjectNameInput.trim()); setEnrollProfessorInput(''); }
      } else { const responseText = await response.text(); console.warn("올바른 HTTP 응답(2xx)을 받았으나 JSON 형식이 아닙니다. 응답 내용:", responseText); setSubjectApiMessage('과목 정보를 찾을 수 없거나 서버 응답 형식이 올바르지 않습니다. 새로 등록하시겠습니까?'); setShowEnrollForm(true); setEnrollClassIdInput(subjectNameInput.trim()); setEnrollProfessorInput(''); }
    } catch (err) { console.error("Search subject error:", err); setSubjectApiMessage('과목 조회 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.'); setShowEnrollForm(false); }
  };
  const handleSelectSubject = () => {
    if (searchedSubject) { setNewProject(prev => ({ ...prev, subject: searchedSubject })); setSubjectApiMessage(`선택된 과목: ${searchedSubject.className}`); setSearchedSubject(null); setShowEnrollForm(false); }
  };
  const handleEnrollSubject = async () => {
    if (!enrollClassIdInput.trim() || !subjectNameInput.trim() || !enrollProfessorInput.trim()) { setSubjectApiMessage('과목 ID, 과목명, 교수명을 모두 입력해주세요.'); return; }
    setSubjectApiMessage('새 과목 등록 중...'); setIsSubmitting(true); const newClassData = { classId: enrollClassIdInput.trim(), className: subjectNameInput.trim(), professor: enrollProfessorInput.trim() };
    try {
      const response = await fetch(`${API_BASE_URL}/class/enroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClassData) });
      const responseText = await response.text();
      if (response.ok) {
        setSubjectApiMessage(`${responseText}`); setNewProject(prev => ({ ...prev, subject: newClassData })); setShowEnrollForm(false); setSearchedSubject(null);
      } else { setSubjectApiMessage(`등록 실패: ${responseText}`); }
    } catch (err) {
      console.error("Enroll subject error:", err); setSubjectApiMessage('과목 등록 중 오류가 발생했습니다. 네트워크를 확인해주세요.');
    } finally { setIsSubmitting(false); }
  };

  const handleSearchMembers = async () => {
    if (!memberSearchQuery.trim()) { setMemberApiMessage('검색할 팀원의 학번 또는 이름을 입력해주세요.'); return; }
    setMemberApiMessage('팀원 검색 중...'); setSearchedMembers([]);
    try {
      const response = await fetch(`${API_BASE_URL}/member/search?query=${encodeURIComponent(memberSearchQuery.trim())}`);
      if (response.status === 404) { setMemberApiMessage(`'${memberSearchQuery.trim()}'에 해당하는 팀원을 찾을 수 없습니다.`); setSearchedMembers([]); return; }
      if (!response.ok) { let errorMessage = `HTTP 오류! 상태: ${response.status}`; try { const errorText = await response.text(); if (errorText && errorText.trim() !== "") errorMessage = `${errorMessage} - ${errorText.trim()}`; } catch (e) { console.warn("팀원 검색 오류 응답 본문 파싱 불가:", e); } setMemberApiMessage(`팀원 검색 실패: ${errorMessage}`); return; }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const responseData = await response.json();
        if (responseData && responseData.length > 0) {
          setSearchedMembers(responseData); setMemberApiMessage(`${responseData.length}명의 팀원을 찾았습니다.`);
        } else { setMemberApiMessage('검색된 팀원이 없습니다.'); setSearchedMembers([]); }
      } else { const responseText = await response.text(); console.warn("팀원 검색: 올바른 HTTP 응답(2xx)을 받았으나 JSON 형식이 아닙니다. 응답 내용:", responseText); setMemberApiMessage('팀원 검색 응답 형식이 올바르지 않습니다.'); setSearchedMembers([]); }
    } catch (err) { console.error("Search members error:", err); setMemberApiMessage('팀원 검색 중 오류가 발생했습니다. 네트워크를 확인해주세요.'); setSearchedMembers([]); }
  };
  const handleAddSearchedMember = (memberToAdd) => {
    const isAlreadyAdded = newProject.teamMembers.some(member => member.id === memberToAdd.userId);
    if (isAlreadyAdded) { setMemberApiMessage(`${memberToAdd.userName}(${memberToAdd.userId})님은 이미 추가된 팀원입니다.`); return; }
    const newTeamMember = { id: memberToAdd.userId, name: memberToAdd.userName };
    setNewProject(prev => ({ ...prev, teamMembers: [...prev.teamMembers, newTeamMember] }));
    setMemberApiMessage(`${memberToAdd.userName}(${memberToAdd.userId})님을 팀원으로 추가했습니다.`);
  };

  const handleEditProject = (project) => {
    const dateForInput = project.date ? project.date.substring(0, 16) : '';
    setSelectedProject({ ...project, date: dateForInput });
    setShowEditPopup(true);
  };

  const handleSaveProject = async () => {
    if (!selectedProject || !selectedProject.projId) { alert("수정할 프로젝트 정보가 없습니다."); return; }
    if (!selectedProject.projectName.trim()) { alert("프로젝트 명을 입력해주세요."); return; }

    const updatePayload = {
      projectId: selectedProject.projId,
      date: selectedProject.date ? new Date(selectedProject.date + ':00Z').toISOString() : new Date().toISOString(),
      goal: selectedProject.goal,
      projName: selectedProject.projectName,
      github: selectedProject.githubLink,
      teamName: selectedProject.teamName,
    };

    console.log("Updating project payload:", updatePayload);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/update/${selectedProject.projId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || `프로젝트 수정에 실패했습니다.`);
      }
      alert('프로젝트가 성공적으로 수정되었습니다.');
      fetchProjects();
      setShowEditPopup(false); setSelectedProject(null);
    } catch (submissionError) {
      console.error("Failed to update project:", submissionError); alert(`프로젝트 수정 오류: ${submissionError.message}`);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="Dashboard">
      <main className={`App-content ${sidebarOpen ? 'shifted' : ''}`}>
        <div className="main-header">
          <button onClick={handleCreateProject} className="add-project-button">
            <IoAddCircle size={20} style={{ marginRight: '8px' }} />
            새 프로젝트 추가
          </button>
        </div>

        {isLoading && !isSubmitting ? (<p className="loading-message">프로젝트 목록 로딩 중...</p>) :
          error ? (<p className="error">{error}</p>) : (
            <>
              <div className="project-list">
                {currentProjects.map(project => (
                  <div className="project-card" key={project.projId}>
                    <div className="project-card-header">
                      <h2 title={project.projectName}>{project.projectName}</h2>
                      <div className="project-controls">
                        <IoBookmark size={20} color="gold" style={{ cursor: 'pointer' }} title="북마크" />
                        <IoSettings size={20} color="#6c757d" style={{ cursor: 'pointer' }} onClick={() => handleEditProject(project)} title="설정" />
                      </div>
                    </div>
                    <div className="project-card-body">
                      {project.teamName && (<p className="project-detail"><strong>팀 이름:</strong> {project.teamName}</p>)}
                      <p className="project-detail">
                        <strong>과목:</strong>
                        {project.subject
                          ? `${project.subject.className || '이름 없음'} (ID: ${project.subject.classId}, ${project.subject.professor || '담당교수 미지정'})`
                          : (project.classId ? `ID: ${project.classId}` : 'N/A')
                        }
                      </p>
                      <p className="project-detail project-goal"><strong>목표:</strong> {project.goal || 'N/A'}</p>
                      {project.date && (<p className="project-detail project-date"><strong>마감일:</strong> {new Date(project.date).toLocaleDateString()}</p>)} {/* "등록일/수정일" -> "일자" */}
                      <div className="team-members-simplified">
                        <h3>팀원:</h3>
                        {project.teamMembers && project.teamMembers.length > 0 ? (
                          <ul>{project.teamMembers.map((member) => (<li key={member.id} title={`${member.name} (${member.id})`}>{member.name || member.id}</li>))}</ul>
                        ) : (<p className="no-members-text">팀원이 없습니다.</p>)}
                      </div>
                    </div>
                    <div className="project-card-footer">
                      <Link to={`/project/${project.projId}`} className="project-link">프로젝트로 이동</Link>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                projectsPerPage={projectsPerPage}
                totalProjects={projects.length}
                paginate={paginate}
                currentPage={currentPage}
              />
            </>
          )}
      </main>

      {/* 새 프로젝트 생성 팝업 */}
      {showProjectPopup && (
        <div className="popupfordashboard">
          <div className="popup-inner">
            <h2>새 프로젝트 생성</h2>
            <label>프로젝트명: <input type="text" name="projectName" value={newProject.projectName} onChange={handleChange} disabled={isSubmitting} /></label>
            <label>팀 이름: <input type="text" name="teamName" value={newProject.teamName} onChange={handleChange} disabled={isSubmitting} /></label>
            <label>GitHub 링크: <input type="text" name="githubLink" value={newProject.githubLink} onChange={handleChange} placeholder="예: https://github.com/team/repo" disabled={isSubmitting} /> </label>
            <label>프로젝트 목표: <input type="text" name="goal" value={newProject.goal} onChange={handleChange} disabled={isSubmitting} /></label>
            <div className="subject-section">
              <label htmlFor="subjectNameInputId">과목명:</label>
              <div className="subject-search-container">
                <input id="subjectNameInputId" type="text" value={subjectNameInput} onChange={(e) => setSubjectNameInput(e.target.value)} placeholder="과목명 입력 후 조회" disabled={isSubmitting} />
                <button type="button" onClick={handleSearchSubject} className="search-subject-button" disabled={isSubmitting}>조회</button>
              </div>
              {subjectApiMessage && <p className={`api-message ${showEnrollForm ? 'enroll-prompt' : ''}`}>{subjectApiMessage}</p>}
              {searchedSubject && !showEnrollForm && (
                <div className="subject-found-details">
                  <div className="subject-info-wrapper">
                    <p className="subject-text-details"><strong>검색된 과목:</strong> {searchedSubject.className} (교수: {searchedSubject.professor || 'N/A'})</p>
                    <button type="button" onClick={handleSelectSubject} className="select-subject-button" disabled={isSubmitting}>이 과목 선택</button>
                  </div>
                </div>
              )}
              {showEnrollForm && (
                <div className="subject-enroll-form">
                  <h4>새 과목 등록</h4>
                  <label>과목 ID (필수): <input type="text" value={enrollClassIdInput} onChange={(e) => setEnrollClassIdInput(e.target.value)} placeholder="새 과목의 고유 ID" disabled={isSubmitting} /></label>
                  <label>과목명 (자동 입력됨): <input type="text" value={subjectNameInput} readOnly disabled style={{ backgroundColor: '#e9ecef' }} /></label>
                  <label>교수명 (필수): <input type="text" value={enrollProfessorInput} onChange={(e) => setEnrollProfessorInput(e.target.value)} placeholder="교수님 성함" disabled={isSubmitting} /></label>
                  <button type="button" onClick={handleEnrollSubject} className="enroll-subject-button" disabled={isSubmitting}>
                    {isSubmitting ? '등록 중...' : '이 내용으로 등록'}
                  </button>
                </div>
              )}
            </div>
            <div className="member-section">
              <label htmlFor="memberSearchQueryInputId">팀원 검색 (학번/이름):</label>
              <div className="member-search-container">
                <input id="memberSearchQueryInputId" type="text" value={memberSearchQuery} onChange={handleMemberSearchQueryChange} placeholder="학번 또는 이름으로 검색" disabled={isSubmitting} />
                <button type="button" onClick={handleSearchMembers} className="search-member-button" disabled={isSubmitting}>검색</button>
              </div>
              {memberApiMessage && <p className="api-message">{memberApiMessage}</p>}
              {searchedMembers.length > 0 && (
                <div className="searched-members-list">
                  <h4>검색 결과:</h4>
                  <ul>
                    {searchedMembers.map((member) => (
                      <li key={member.userId}>
                        <span>{member.userName} ({member.userId})</span>
                        <button type="button" onClick={() => handleAddSearchedMember(member)} className="add-searched-member-button" disabled={newProject.teamMembers.some(tm => tm.id === member.userId) || isSubmitting}>
                          {newProject.teamMembers.some(tm => tm.id === member.userId) ? '추가됨' : '추가'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="added-members">
              <h4>추가된 팀원:</h4>
              {newProject.teamMembers.length > 0 ? (
                <ul>{newProject.teamMembers.map((member) => (<li key={member.id}>{member.name ? `${member.name} (${member.id})` : member.id}</li>))}</ul>
              ) : (<p>추가된 팀원이 없습니다.</p>)}
            </div>

            <div className="popup-actions">
              <button onClick={handleAddProject} className="popup-create-button" disabled={isSubmitting}>
                {isSubmitting ? '생성 중...' : '프로젝트 생성'}
              </button>
              <button onClick={handleCloseProjectPopup} className="popup-cancel-button" disabled={isSubmitting}>취소</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && selectedProject && (
        <div className="popupfordashboard">
          <div className="popup-inner edit-popup">
            <h2>프로젝트 편집</h2>
            <div className="form-group">
              <label htmlFor="edit-projectName">프로젝트명</label>
              <input id="edit-projectName" type="text" name="projectName" value={selectedProject.projectName} onChange={handleEditChange} disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-teamName">팀 이름</label>
              <input id="edit-teamName" type="text" name="teamName" value={selectedProject.teamName || ''} onChange={handleEditChange} disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-goal">프로젝트 목표</label>
              <input id="edit-goal" type="text" name="goal" value={selectedProject.goal} onChange={handleEditChange} disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-githubLink">GitHub 링크</label>
              <input id="edit-githubLink" type="text" name="githubLink" value={selectedProject.githubLink || ''} onChange={handleEditChange} disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-date">마감일</label>
              <input
                id="edit-date"
                type="datetime-local"
                name="date"
                value={selectedProject.date ? selectedProject.date.substring(0, 16) : ''}
                onChange={handleEditChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="popup-actions">
              <button onClick={handleSaveProject} className="popup-save-button" disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => { setShowEditPopup(false); setSelectedProject(null); }} className="popup-cancel-button" disabled={isSubmitting}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

const Pagination = ({ projectsPerPage, totalProjects, paginate, currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalProjects / projectsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handlePaginate = (e, number) => {
    e.preventDefault();
    paginate(number);
  };

  return (
    <nav>
      <ul className='pagination'>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <a onClick={(e) => handlePaginate(e, number)} href='!#' className='page-link'>
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};