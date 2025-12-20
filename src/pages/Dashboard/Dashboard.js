import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IoAddCircle, IoBookmark, IoSettings } from "react-icons/io5";
import './Dashboard.css';

const API_BASE_URL = 'https://teamplate-api.site';

function Dashboard() {
  // --- States ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(4); // 한 화면에 보일 프로젝트 수
  
  // Popups
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  
  // Data for manipulation
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProject, setNewProject] = useState(initialProject());
  
  // Status
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const userIdFromStorage = localStorage.getItem('userId');

  // Subject Search States
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [searchedSubject, setSearchedSubject] = useState(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollClassIdInput, setEnrollClassIdInput] = useState('');
  const [enrollProfessorInput, setEnrollProfessorInput] = useState('');
  const [subjectApiMessage, setSubjectApiMessage] = useState('');

  // Member Search States
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchedMembers, setSearchedMembers] = useState([]);
  const [memberApiMessage, setMemberApiMessage] = useState('');

  // --- Helpers ---
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

  // 날짜 포맷팅 (YYYY. MM. DD.)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  };

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

  // --- API Fetching ---
  const fetchProjects = useCallback(async () => {
    if (!userIdFromStorage) {
      console.warn("User ID not available.");
      setIsLoading(false);
      setProjects([]);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/projects/view?userId=${userIdFromStorage}`);
      if (!response.ok) {
        throw new Error('프로젝트 데이터를 불러오는데 실패했습니다.');
      }
      const dataFromApi = await response.json();

      const mappedProjects = dataFromApi.map((projectFromApi, index) => {
        const teamMembers = (projectFromApi.teamones || []).map(apiMember => ({
          id: apiMember.userId,
          name: apiMember.userName,
        }));
        
        const projId = projectFromApi.projectId || projectFromApi.projId || `${projectFromApi.classId}-${index}`;
        
        let subjectData = null;
        if (projectFromApi.classId) {
          subjectData = {
            classId: projectFromApi.classId,
            className: projectFromApi.className || projectFromApi.subjectName || projectFromApi.classId,
            professor: projectFromApi.professor || '',
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
      console.error("Failed to fetch:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userIdFromStorage]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // --- Event Handlers ---
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

  const handleMemberSearchQueryChange = (e) => setMemberSearchQuery(e.target.value);

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

  // --- API Handlers (Create, Search, Update) ---
  const handleAddProject = async () => {
      if (!newProject.projectName.trim()) { alert("프로젝트 명을 입력해주세요."); return; }
      if (!newProject.subject || !newProject.subject.classId) { alert("과목을 선택하거나 등록해주세요."); setSubjectApiMessage("과목을 선택하거나 등록해주세요."); return; }
      if (!newProject.teamName.trim()) { alert("팀 이름을 입력해주세요."); return; }
  
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
  
      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_BASE_URL}/projects/create`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projectPayload),
        });
        if (!response.ok) throw new Error('프로젝트 생성 실패');
        const responseData = await response.json();
        
        alert(responseData.message || '프로젝트가 생성되었습니다.');
        fetchProjects();
        handleCloseProjectPopup();
      } catch (err) {
        alert(`오류: ${err.message}`);
      } finally { setIsSubmitting(false); }
  };

  const handleSearchSubject = async () => {
      if (!subjectNameInput.trim()) return;
      setSubjectApiMessage('조회 중...');
      try {
          const response = await fetch(`${API_BASE_URL}/class/name/${encodeURIComponent(subjectNameInput.trim())}`);
          if(response.status === 404) {
              setSubjectApiMessage('과목을 찾을 수 없습니다. 새로 등록해주세요.');
              setShowEnrollForm(true);
              setEnrollClassIdInput(subjectNameInput.trim());
              setEnrollProfessorInput('');
              return;
          }
          const data = await response.json();
          if(data && data.length > 0) {
              setSearchedSubject(data[0]);
              setSubjectApiMessage('');
              setShowEnrollForm(false);
          }
      } catch(e) { console.error(e); setSubjectApiMessage('오류 발생'); }
  };

  const handleSelectSubject = () => {
    if (searchedSubject) { 
        setNewProject(prev => ({ ...prev, subject: searchedSubject })); 
        setSearchedSubject(null); 
        setShowEnrollForm(false);
        setSubjectApiMessage(`선택됨: ${searchedSubject.className}`);
    }
  };

  const handleEnrollSubject = async () => {
      if (!enrollClassIdInput.trim() || !subjectNameInput.trim() || !enrollProfessorInput.trim()) {
        setSubjectApiMessage('모든 필드를 입력해주세요.'); return;
      }
      setIsSubmitting(true);
      const newClassData = { classId: enrollClassIdInput.trim(), className: subjectNameInput.trim(), professor: enrollProfessorInput.trim() };
      
      try {
        const response = await fetch(`${API_BASE_URL}/class/enroll`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClassData)
        });
        if(response.ok) {
            setNewProject(prev => ({...prev, subject: newClassData}));
            setShowEnrollForm(false);
            setSubjectApiMessage('과목이 등록 및 선택되었습니다.');
            setSearchedSubject(null);
        } else {
            const msg = await response.text();
            setSubjectApiMessage(`등록 실패: ${msg}`);
        }
      } catch (err) {
          setSubjectApiMessage('오류 발생');
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleSearchMembers = async () => {
      if(!memberSearchQuery.trim()) return;
      setMemberApiMessage('검색 중...');
      try {
          const response = await fetch(`${API_BASE_URL}/member/search?query=${encodeURIComponent(memberSearchQuery)}`);
          if(response.ok) {
              const data = await response.json();
              setSearchedMembers(data);
              setMemberApiMessage('');
          } else {
              setSearchedMembers([]);
              setMemberApiMessage('검색 결과가 없습니다.');
          }
      } catch(e) { console.error(e); setMemberApiMessage('오류 발생'); }
  };

  const handleAddSearchedMember = (member) => {
      if(newProject.teamMembers.some(m => m.id === member.userId)) return;
      setNewProject(prev => ({...prev, teamMembers: [...prev.teamMembers, {id: member.userId, name: member.userName}]}));
  };
  
  const handleEditProject = (project) => {
    const dateForInput = project.date ? project.date.substring(0, 16) : '';
    setSelectedProject({ ...project, date: dateForInput });
    setShowEditPopup(true);
  };
  
  const handleSaveProject = async () => {
      if (!selectedProject || !selectedProject.projId) return;
      
      const updatePayload = {
        projectId: selectedProject.projId,
        date: selectedProject.date ? new Date(selectedProject.date + ':00Z').toISOString() : new Date().toISOString(),
        goal: selectedProject.goal,
        projName: selectedProject.projectName,
        github: selectedProject.githubLink,
        teamName: selectedProject.teamName,
      };

      setIsSubmitting(true);
      try {
          const response = await fetch(`${API_BASE_URL}/projects/update/${selectedProject.projId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatePayload),
          });

          if (!response.ok) throw new Error('수정 실패');
          
          alert('프로젝트가 성공적으로 수정되었습니다.');
          fetchProjects(); // 목록 새로고침
          setShowEditPopup(false);
          setSelectedProject(null);
      } catch(err) {
          alert(`수정 오류: ${err.message}`);
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="Dashboard">
      <main className={`App-content ${sidebarOpen ? 'shifted' : ''}`}>
        <div className="main-header">
           <div style={{flexGrow:1}}></div> 
          <button onClick={handleCreateProject} className="add-project-button">
            <IoAddCircle size={20} />
            새 프로젝트 추가
          </button>
        </div>

        {isLoading && !isSubmitting ? (
          <p className="loading-message">프로젝트 목록 로딩 중...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            <div className="project-list">
              {currentProjects.map(project => (
                <div className="project-card" key={project.projId}>
                  <div className="project-card-header">
                    <h2 title={project.projectName}>{project.projectName}</h2>
                    <div className="project-controls">
                      <IoBookmark size={20} color="#f1c40f" style={{ cursor: 'pointer' }} title="북마크" />
                      <IoSettings size={20} color="#95a5a6" style={{ cursor: 'pointer' }} onClick={() => handleEditProject(project)} title="설정" />
                    </div>
                  </div>
                  
                  <div className="project-card-body">
                    {project.teamName && (
                      <p className="project-detail"><strong>팀:</strong> {project.teamName}</p>
                    )}
                    
                    <p className="project-detail">
                      <strong>과목:</strong>
                      {project.subject 
                        ? `${project.subject.className} (${project.subject.professor || '-'})`
                        : (project.classId || 'N/A')}
                    </p>

                    <div className="project-goal">
                        <strong>목표:</strong> {project.goal || '목표가 설정되지 않았습니다.'}
                    </div>

                    <p className="project-date">
                        마감일: {formatDate(project.date)}
                    </p>

                    <div className="team-members-simplified">
                      <h3>팀원</h3>
                      {project.teamMembers && project.teamMembers.length > 0 ? (
                        <ul>
                          {project.teamMembers.map((member) => (
                            <li key={member.id} title={member.id}>
                                {member.name || member.id}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{fontSize:'0.8rem', color:'#aaa'}}>팀원 없음</span>
                      )}
                    </div>
                  </div>

                  <div className="project-card-footer">
                    <Link to={`/project/${project.projId}`} className="project-link">
                        프로젝트로 이동
                    </Link>
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

      {/* --- Create Popup --- */}
      {showProjectPopup && (
        <div className="popupfordashboard">
          <div className="popup-inner">
            <h2>새 프로젝트 생성</h2>
            
            <label>프로젝트명</label>
            <input type="text" name="projectName" value={newProject.projectName} onChange={handleChange} placeholder="프로젝트 이름을 입력하세요" />
            
            <label>팀 이름</label>
            <input type="text" name="teamName" value={newProject.teamName} onChange={handleChange} placeholder="팀 이름을 입력하세요" />

            {/* 과목 검색 섹션 */}
            <div className="subject-section">
                <label>과목 검색</label>
                <div className="subject-search-container">
                    <input type="text" value={subjectNameInput} onChange={(e)=>setSubjectNameInput(e.target.value)} placeholder="과목명 입력" />
                    <button type="button" onClick={handleSearchSubject} className="search-subject-button">조회</button>
                </div>
                {subjectApiMessage && <p style={{fontSize:'0.8rem', color: '#a32828'}}>{subjectApiMessage}</p>}
                
                {searchedSubject && !showEnrollForm && (
                    <div style={{background:'#fff', padding:'10px', marginTop:'5px', border:'1px solid #ddd', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span>{searchedSubject.className} ({searchedSubject.professor})</span>
                        <button type="button" onClick={handleSelectSubject} className="select-subject-button">선택</button>
                    </div>
                )}
                
                {showEnrollForm && (
                     <div style={{marginTop:'10px', borderTop:'1px dashed #ccc', paddingTop:'10px'}}>
                         <label>새 과목 등록</label>
                         <input type="text" placeholder="과목 ID" value={enrollClassIdInput} onChange={(e)=>setEnrollClassIdInput(e.target.value)} />
                         <input type="text" placeholder="교수명" value={enrollProfessorInput} onChange={(e)=>setEnrollProfessorInput(e.target.value)} />
                         <button type="button" onClick={handleEnrollSubject} className="enroll-subject-button">등록 후 선택</button>
                     </div>
                )}
            </div>

            <label>목표</label>
            <input type="text" name="goal" value={newProject.goal} onChange={handleChange} />
            
            <label>GitHub 링크</label>
            <input type="url" name="githubLink" value={newProject.githubLink} onChange={handleChange} placeholder="https://" />

            {/* 팀원 검색 섹션 */}
            <div className="member-section">
                <label>팀원 초대</label>
                <div className="member-search-container">
                    <input type="text" value={memberSearchQuery} onChange={handleMemberSearchQueryChange} placeholder="학번 또는 이름" />
                    <button type="button" onClick={handleSearchMembers} className="search-member-button">검색</button>
                </div>
                {memberApiMessage && <p className="api-message">{memberApiMessage}</p>}
                
                {searchedMembers.length > 0 && (
                    <ul style={{listStyle:'none', padding:0, maxHeight:'100px', overflowY:'auto', border:'1px solid #eee'}}>
                        {searchedMembers.map(m => (
                            <li key={m.userId} style={{padding:'5px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                                <span>{m.userName} ({m.userId})</span>
                                <button type="button" onClick={() => handleAddSearchedMember(m)} className="add-searched-member-button">추가</button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="added-members" style={{marginTop:'10px'}}>
                    <small>추가된 팀원: </small>
                    {newProject.teamMembers.map(m => (
                        <span key={m.id} style={{marginRight:'5px', color:'#a32828', background:'#fcecea', padding:'2px 5px', borderRadius:'4px', fontSize:'0.8rem'}}>
                            {m.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="popup-actions">
              <button onClick={handleCloseProjectPopup} className="popup-cancel-button">취소</button>
              <button onClick={handleAddProject} className="popup-create-button" disabled={isSubmitting}>
                  {isSubmitting ? '생성 중..' : '프로젝트 생성'}
              </button>
            </div>
          </div>
        </div>
      )}

       {/* --- Edit Popup --- */}
       {showEditPopup && selectedProject && (
        <div className="popupfordashboard">
           <div className="popup-inner">
               <h2>프로젝트 수정</h2>
               
               <label>프로젝트명</label>
               <input 
                 type="text" 
                 name="projectName" 
                 value={selectedProject.projectName} 
                 onChange={handleEditChange} 
               />

               <label>팀 이름</label>
               <input 
                 type="text" 
                 name="teamName" 
                 value={selectedProject.teamName || ''} 
                 onChange={handleEditChange} 
               />

               <label>목표</label>
               <input 
                 type="text" 
                 name="goal" 
                 value={selectedProject.goal || ''} 
                 onChange={handleEditChange} 
               />

               <label>GitHub 링크</label>
               <input 
                 type="url" 
                 name="githubLink" 
                 value={selectedProject.githubLink || ''} 
                 onChange={handleEditChange} 
                 placeholder="https://"
               />

               <label>마감일</label>
               <input
                type="datetime-local"
                name="date"
                value={selectedProject.date ? selectedProject.date.substring(0, 16) : ''}
                onChange={handleEditChange}
               />

               <div className="popup-actions">
                   <button onClick={() => { setShowEditPopup(false); setSelectedProject(null); }} className="popup-cancel-button">취소</button>
                   <button onClick={handleSaveProject} className="popup-save-button">저장</button>
               </div>
           </div>
        </div>
       )}
    </div>
  );
}

export default Dashboard;

// --- Pagination Component ---
const Pagination = ({ projectsPerPage, totalProjects, paginate, currentPage }) => {
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(totalProjects / projectsPerPage); i++) {
    pageNumbers.push(i);
  }
  return (
    <nav>
      <ul className='pagination'>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <a onClick={(e) => { e.preventDefault(); paginate(number); }} href='!#' className='page-link'>
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};