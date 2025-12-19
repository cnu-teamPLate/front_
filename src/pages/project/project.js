import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 

import ProjectSidebar from '../../components/SideBar/ProjectSidebar';
import './project.css';

// API base URL
const API_BASE_URL = 'https://teamplate-api.site';

function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectData = async () => {
      setLoading(true);
      setError('');
      const userId = localStorage.getItem('userId');

      if (!userId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        setLoading(false);
        return;
      }

      try {
        // 1. 전체 프로젝트 목록 조회 후 현재 프로젝트 찾기
        const projectsResponse = await fetch(`${API_BASE_URL}/projects/view?userId=${userId}`);
        if (!projectsResponse.ok) throw new Error('프로젝트 목록을 불러오는 데 실패했습니다.');
        const allProjects = await projectsResponse.json();
        const currentProject = allProjects.find(p => p.projId === projectId);
        
        if (currentProject) {
          setProject(currentProject);
        } else {
          throw new Error('해당 프로젝트 정보를 찾을 수 없습니다.');
        }

        // 2. 팀원 목록 조회
        const membersResponse = await fetch(`${API_BASE_URL}/member/project/${projectId}`);
        if (!membersResponse.ok) {
          if (membersResponse.status === 404) throw new Error('존재하지 않는 프로젝트입니다.');
          throw new Error('팀원 정보를 불러오는 데 실패했습니다.');
        }
        const memberData = await membersResponse.json();
        setMembers(memberData);

      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch project data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  if (loading) {
    return <div className="project-loading">Loading project details...</div>;
  }

  if (error) {
    return <div className="project-error">오류: {error}</div>;
  }

  if (!project) {
    return <div className="project-error">프로젝트를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="ProjectPage">
      {/* ✨ 분리된 사이드바 컴포넌트 사용 */}
      <ProjectSidebar projectId={projectId} />
      
      <main className="project-content">
        <div className="project-header">
          <h1>{project.projName || '프로젝트 이름 없음'}</h1>
          <p className="project-goal">{project.goal || '목표가 설정되지 않았습니다.'}</p>
        </div>

        <div className="project-main-content">
          <div className="team-members-card">
            <h2>팀원 목록</h2>
            {members.length > 0 ? (
              <ul>
                {members.map((member) => (
                  <li key={member.id}>
                    <span className="member-name">{member.name}</span>
                    <span className="member-id">({member.id})</span>
                    <span className="member-email">{member.mail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>이 프로젝트에 참여중인 팀원이 없습니다.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetail;