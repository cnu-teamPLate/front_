import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './project.css';

// API base URL
const API_BASE_URL = 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080';

// --- ProjectSidebar Component ---
// This could be moved to its own file in /components/ProjectSidebar/ for better organization
const ProjectSidebar = ({ projectId }) => {
  const userId = localStorage.getItem('userId');
  const sidebarLinks = [
    { path: `/assignment?projectId=${projectId}&userId=${userId}`, label: '과제' },
    { path: `/project/${projectId}/schedule`, label: '프로젝트 일정' },
    { path: `/project/${projectId}/MeetingLog`, label: '회의록' },
    { path: `/project/${projectId}/FileUpload`, label: '자료 업로드' },
  ];

  return (
    <aside className="project-sidebar">
      <nav>
        <ul>
          {sidebarLinks.map(link => (
            <li key={link.path}>
              <Link to={link.path}>{link.label}</Link>
            </li>
          ))}
        </ul>
        <hr />
        <ul>
          <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer">깃허브 바로가기</a></li>
          <li><Link to="/useful-sites">팀플 유용 사이트</Link></li>
          <li><Link to="/experiences">경험담 보기</Link></li>
          <li><Link to="/meeting-rooms">우리 학교 회의실</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

// --- ProjectDetail Page ---

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
        // 1. Fetch all projects to find details for the current one
        const projectsResponse = await fetch(`${API_BASE_URL}/projects/view?userId=${userId}`);
        if (!projectsResponse.ok) throw new Error('프로젝트 목록을 불러오는 데 실패했습니다.');
        const allProjects = await projectsResponse.json();
        const currentProject = allProjects.find(p => p.projId === projectId);
        if (currentProject) {
            setProject(currentProject);
        } else {
            throw new Error('해당 프로젝트 정보를 찾을 수 없습니다.');
        }

        // 2. Fetch project members
        const membersResponse = await fetch(`${API_BASE_URL}/member/project/${projectId}`);
        if (!membersResponse.ok) {
            if(membersResponse.status === 404) throw new Error('존재하지 않는 프로젝트입니다.');
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

  // 과제 페이지로 이동하는 함수 제거됨

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
      {/* Sidebar 제거됨 */}
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
            {/* 과제 보러가기 버튼 제거됨 */}
        </div>
      </main>
    </div>
  );
}

export default ProjectDetail;