import './AssignmentDetail.css';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const baseURL = 'https://www.teamplate-api.site/';

function AssignmentDetail() {
    const [searchParams] = useSearchParams();
    const taskId = searchParams.get('taskId');
    const [assignment, setAssignment] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!taskId) {
            setError("과제 ID가 제공되지 않았습니다.");
            setLoading(false);
            return;
        }

        const fetchAssignmentDetail = async () => {
            try {
                const response = await axios.get(`${baseURL}/task/view/${taskId}`);
                setAssignment(response.data);
            } catch (err) {
                if (err.response) {
                    if (err.response.status === 404) {
                        setError("해당 ID의 과제를 찾을 수 없습니다.");
                    } else if (err.response.status === 500) {
                        setError("더 이상 존재하지 않는 과제이거나 유저의 과제가 아닙니다.");
                    } else {
                        setError(`오류가 발생했습니다: ${err.response.statusText}`);
                    }
                } else {
                    setError("서버에 연결할 수 없습니다.");
                }
                console.error("Error fetching assignment details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignmentDetail();
    }, [taskId]);

    if (loading) {
        return <div className="assignment-detail-container">로딩 중...</div>;
    }

    if (error) {
        return <div className="assignment-detail-container error">{error}</div>;
    }

    if (!assignment) {
        return <div className="assignment-detail-container">과제 정보를 찾을 수 없습니다.</div>;
    }

    const {
        taskName,
        projName,
        userName,
        cate,
        level,
        date,
        detail,
        files
    } = assignment;

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ko-KR', options);
    };
    
    const getComplexityLabel = (complexity) => {
        switch (complexity) {
            case 1: return '쉬움';
            case 2: return '보통';
            case 3: return '어려움';
            default: return '알 수 없음';
        }
    };

    return (
        <div className="assignment-detail-container">
            <div className="assignment-detail-card">
                <header className="card-header">
                    <h1>{taskName}</h1>
                    <div className="header-meta">
                        <span><strong>프로젝트:</strong> {projName}</span>
                    </div>
                </header>
                <section className="card-body">
                    <div className="task-info">
                        <p><strong>담당자:</strong> {userName}</p>
                        <p><strong>분류:</strong> {cate}</p>
                        <p><strong>난이도:</strong> <span className={`level-tag level-${level}`}>{getComplexityLabel(level)}</span></p>
                        <p><strong>마감일:</strong> {formatDate(date)}</p>
                    </div>
                    <div className="task-description">
                        <h3>과제 설명</h3>
                        <p>{detail}</p>
                    </div>
                    {files && files.length > 0 && (
                        <div className="task-files">
                            <h3>첨부 파일</h3>
                            <ul>
                                {files.map(file => (
                                    <li key={file.id}>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">{file.filename}</a>
                                        <span className="upload-date">{formatDate(file.uploadDate)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
                <footer className="card-footer">
                    <button className="action-button">수정</button>
                    <button className="action-button delete-button">삭제</button>
                </footer>
            </div>
        </div>
    );
}

export default AssignmentDetail;
