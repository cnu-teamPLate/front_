import './AssignmentDetail.css';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';


const baseURL = 'https://teamplate-api.site';

function AssignmentDetail() {
    const [searchParams] = useSearchParams();
    const taskId = searchParams.get('taskId');
    const projId = searchParams.get('projId');
    const [assignment, setAssignment] = useState(null);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        description: '',
        assigneeId: '',
        date: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!taskId) {
            setError("과제 ID가 제공되지 않았습니다.");
            setLoading(false);
            return;
        }

        // projId가 필수인 경우 에러 표시
        if (!projId) {
            setError("프로젝트 ID가 필요합니다. 과제 목록에서 다시 클릭해주세요.");
            setLoading(false);
            return;
        }

        const fetchAssignmentDetail = async () => {
            // 프로젝트 전체 과제를 가져와서 taskId로 찾기 (담당자가 다른 과제도 볼 수 있도록)
            const apiUrl = `${baseURL}/task/view?projId=${projId}`;
            console.log("=== AssignmentDetail API 호출 정보 ===");
            console.log("URL:", apiUrl);
            console.log("전달된 taskId (URL 파라미터):", taskId, "타입:", typeof taskId);
            console.log("전달된 projId (URL 파라미터):", projId, "타입:", typeof projId);
            console.log("=====================================");

            try {
                const response = await axios.get(apiUrl);
                console.log("Response received:", response.status, response.data);

                // 응답이 배열인 경우, taskId와 일치하는 항목 찾기
                if (Array.isArray(response.data)) {
                    // taskId를 숫자로 변환하여 비교 (API 응답의 taskId 타입에 따라 조정 필요)
                    const taskIdNum = Number(taskId);
                    const foundAssignment = response.data.find(item =>
                        item.taskId === taskIdNum ||
                        item.taskId === taskId ||
                        String(item.taskId) === String(taskId)
                    );

                    if (foundAssignment) {
                        console.log("=== 📥 새로고침 시 서버에서 가져온 과제 데이터 ===");
                        console.log("과제를 찾았습니다:", foundAssignment);
                        console.log("상세 내용:");
                        console.log("  - detail:", foundAssignment.detail);
                        console.log("  - userName:", foundAssignment.userName);
                        console.log("  - date:", foundAssignment.date);
                        console.log("  - 전체 데이터:", JSON.stringify(foundAssignment, null, 2));
                        console.log("=============================================");
                        setAssignment(foundAssignment);

                        // 과제에 첨부된 파일 목록 불러오기
                        await fetchAttachedFiles(taskId);
                    } else {
                        console.error("과제를 찾을 수 없습니다. taskId:", taskId, "응답 데이터:", response.data);
                        setError(`과제 ID ${taskId}에 해당하는 과제를 찾을 수 없습니다.`);
                    }
                } else {
                    // 배열이 아닌 경우 (단일 객체인 경우)
                    setAssignment(response.data);

                    // 과제에 첨부된 파일 목록 불러오기
                    if (response.data?.taskId) {
                        await fetchAttachedFiles(response.data.taskId);
                    }
                }
            } catch (err) {
                let errorMessage = "과제 정보를 불러오는 중 오류가 발생했습니다.";

                // 상세한 에러 정보 로깅
                console.error("Error fetching assignment details:", {
                    message: err.message,
                    code: err.code,
                    url: apiUrl,
                    taskId: taskId,
                    response: err.response ? {
                        status: err.response.status,
                        statusText: err.response.statusText,
                        data: err.response.data,
                        headers: err.response.headers
                    } : null,
                    request: err.request ? {
                        status: err.request.status,
                        readyState: err.request.readyState
                    } : null,
                    config: err.config ? {
                        url: err.config.url,
                        method: err.config.method,
                        headers: err.config.headers
                    } : null
                });

                if (err.response) {
                    // 서버가 응답했지만 에러 상태 코드를 반환한 경우
                    const status = err.response.status;
                    const statusText = err.response.statusText;
                    const errorData = err.response.data;

                    console.error(`API Error Response: ${status} ${statusText}`, errorData);

                    if (status === 404) {
                        errorMessage = "해당 ID의 과제를 찾을 수 없습니다.";
                    } else if (status === 500) {
                        errorMessage = "더 이상 존재하지 않는 과제이거나 유저의 과제가 아닙니다.";
                    } else if (status === 401) {
                        errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
                    } else if (status === 403) {
                        errorMessage = "이 과제에 접근할 권한이 없습니다.";
                    } else {
                        const serverMessage = errorData?.message || errorData?.error || (typeof errorData === 'string' ? errorData : '');
                        errorMessage = `오류가 발생했습니다 (${status} ${statusText})${serverMessage ? `: ${serverMessage}` : ''}`;
                    }
                } else if (err.request) {
                    // 요청은 보냈지만 응답을 받지 못한 경우
                    console.error("No response received from server");
                    errorMessage = "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.";
                } else {
                    // 요청 설정 중 오류가 발생한 경우
                    console.error("Request setup error:", err.message);
                    errorMessage = `요청 설정 중 오류가 발생했습니다: ${err.message}`;
                }

                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignmentDetail();
    }, [taskId, projId]);

    // 수정 모드 진입 시 폼 초기화
    useEffect(() => {
        if (isEditing && assignment) {
            let dateValue = '';
            if (assignment.date) {
                // assignment.date는 Unix timestamp (초 단위)일 수 있으므로 확인
                // Assignment.js에서 item.date * 1000을 사용하므로 여기서도 동일하게 처리
                const timestamp = typeof assignment.date === 'number' ? assignment.date * 1000 : assignment.date;
                const dateObj = new Date(timestamp);
                if (!isNaN(dateObj.getTime())) {
                    // 로컬 시간으로 변환하여 YYYY-MM-DDTHH:mm 형식으로
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    dateValue = `${year}-${month}-${day}T${hours}:${minutes}`;
                } else {
                    console.error('날짜 변환 실패:', assignment.date, 'timestamp:', timestamp);
                }
            }
            setEditForm({
                description: assignment.detail || '',
                assigneeId: assignment.id || '',
                date: dateValue
            });
        }
        // assignment 의존성 제거 - 수정 모드 진입 시에만 초기화 (assignment 변경 시에는 초기화하지 않음)
    }, [isEditing]);

    // 과제 수정 API 호출
    const handleSaveEdit = async () => {
        if (!taskId || !assignment) return;

        setIsSaving(true);
        try {
            const currentDescription = editForm.description;
            const currentAssigneeId = editForm.assigneeId;
            const currentDate = editForm.date;
            
            const requestPayload = {
                description: currentDescription,
                assigneeId: currentAssigneeId,
                date: currentDate
            };
            
            
            console.log('=== 과제 수정 요청 ===');
            console.log('현재 editForm 상태:', editForm);
            console.log('전송할 데이터:', {
                description: currentDescription,
                assigneeId: currentAssigneeId,
                date: currentDate
            });
            
            const editUrl = `${baseURL}/task/edit/${taskId}`;

            console.log('=== 📤 저장 버튼 클릭 - 서버 요청 ===');
            console.log('요청 URL:', editUrl);
            console.log('요청 Method: PUT');
            console.log('요청 Headers:', {
                'Content-Type': 'application/json'
            });
            console.log('요청 Body (Payload):', JSON.stringify(requestPayload, null, 2));
            console.log('요청 상세 내용:');
            console.log('  - description:', currentDescription);
            console.log('  - assigneeId:', currentAssigneeId);
            console.log('  - date:', currentDate);
            console.log('=====================================');

            const response = await axios.put(editUrl, requestPayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('=== 📥 서버 응답 ===');
            console.log('응답 Status:', response.status);
            console.log('응답 Data:', response.data);
            console.log('응답 전체:', response);
            console.log('전송한 데이터와 비교:');
            console.log('  전송한 description:', currentDescription);
            console.log('  전송한 assigneeId:', currentAssigneeId);
            console.log('  전송한 date:', currentDate);
            if (response.data) {
                console.log('  서버 응답 message:', response.data.message);
                console.log('  서버 응답 전체:', JSON.stringify(response.data, null, 2));
            }
            console.log('===================');

            if (response.status === 200) {
                // 수정한 내용은 이미 위에서 변수에 저장됨
                const savedDescription = currentDescription;
                const savedAssigneeId = currentAssigneeId;
                const savedDate = currentDate;

                // 수정 성공 시 즉시 로컬 상태 업데이트
                const updatedAssignment = {
                    ...assignment,
                    detail: savedDescription, // description을 detail로 매핑
                    userName: savedAssigneeId, // assigneeId를 userName으로 매핑
                    date: savedDate || assignment.date // date 업데이트
                };
                setAssignment(updatedAssignment);
                console.log('로컬 상태 업데이트:', updatedAssignment);

                setIsEditing(false);
                alert(response.data.message || '과제가 성공적으로 수정되었습니다.');
                
                // 파일 목록만 다시 불러오기 (과제 데이터는 이미 로컬 상태로 업데이트됨)
                await fetchAttachedFiles(taskId);
            }
        } catch (err) {
            console.error('과제 수정 오류:', err);
            if (err.response?.status === 404) {
                alert(err.response.data?.message || '해당 과제를 찾을 수 없거나 수정에 실패했습니다.');
            } else {
                alert('과제 수정 중 오류가 발생했습니다: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setIsSaving(false);
        }
    };

    // 과제에 첨부된 파일 목록 불러오기
    const fetchAttachedFiles = async (taskIdParam) => {
        if (!taskIdParam || !projId) return;

        setFilesLoading(true);
        try {
            // API는 projId만 지원하므로, projId로 모든 파일을 가져온 후 category 필드로 필터링
            const filesUrl = `${baseURL}/file/view?projId=${projId}`;
            console.log('첨부 파일 목록 요청:', filesUrl);
            console.log('필터링할 taskId:', taskIdParam);

            const filesResponse = await axios.get(filesUrl);
            console.log('첨부 파일 응답 (전체):', filesResponse.data);

            if (Array.isArray(filesResponse.data)) {
                // category 필드가 taskId와 일치하는 파일만 필터링
                // category는 숫자 또는 문자열일 수 있으므로 여러 방식으로 비교
                const taskIdNum = Number(taskIdParam);
                const filteredFiles = filesResponse.data.filter(file => {
                    const fileCategory = file.category;
                    return (
                        fileCategory === taskIdNum ||
                        fileCategory === taskIdParam ||
                        String(fileCategory) === String(taskIdParam) ||
                        Number(fileCategory) === taskIdNum
                    );
                });

                console.log('필터링된 파일 목록:', filteredFiles);
                setAttachedFiles(filteredFiles);
            } else {
                setAttachedFiles([]);
            }
        } catch (err) {
            console.error('첨부 파일 불러오기 오류:', err);
            setAttachedFiles([]);
        } finally {
            setFilesLoading(false);
        }
    };

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

    const formatDate = (dateValue) => {
        // dateValue가 Unix timestamp (초 단위)인지 확인하고 밀리초로 변환
        let timestamp = dateValue;
        if (typeof dateValue === 'number' && dateValue < 10000000000) {
            // 10자리 이하면 초 단위 timestamp로 간주 (10000000000은 2001년 정도)
            timestamp = dateValue * 1000;
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(timestamp).toLocaleDateString('ko-KR', options);
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
                        <p><strong>담당자:</strong> {assignment.userName}</p>
                        <p><strong>분류:</strong> {cate}</p>
                        <p><strong>난이도:</strong> <span className={`level-tag level-${level}`}>{getComplexityLabel(level)}</span></p>
                        <p>
                            <strong>마감일:</strong>
                            {isEditing ? (
                                <input
                                    type="datetime-local"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                    style={{
                                        marginLeft: '8px',
                                        padding: '4px 8px',
                                        fontSize: '14px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                />
                            ) : (
                                <span style={{ marginLeft: '8px' }}>{formatDate(date)}</span>
                            )}
                        </p>
                    </div>
                    <div className="task-description">
                        <h3>과제 설명</h3>
                        {isEditing ? (
                            <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '8px',
                                    fontSize: '14px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    resize: 'none' // 크기 조절 비활성화
                                }}
                                placeholder="과제 설명을 입력하세요"
                            />
                        ) : (
                            <p>{detail}</p>
                        )}
                    </div>

                    {isEditing && (
                        <div className="task-assignee" style={{ marginTop: '20px' }}>
                            <h3>담당자 ID</h3>
                            <input
                                type="text"
                                value={editForm.assigneeId}
                                onChange={(e) => setEditForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                                style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
                                placeholder="담당자 ID를 입력하세요 (예: 01111111)"
                            />
                        </div>
                    )}

                    {/* 업로드된 자료 목록 */}
                    <div className="task-files">
                        <h3>첨부 자료</h3>
                        {filesLoading ? (
                            <p>자료 목록 로딩 중...</p>
                        ) : attachedFiles.length > 0 ? (
                            <div className="attached-files-list">
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                                            <th style={{ padding: '8px' }}>제목</th>
                                            <th style={{ padding: '8px' }}>설명</th>
                                            <th style={{ padding: '8px' }}>업로드 날짜</th>
                                            <th style={{ padding: '8px' }}>다운로드</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attachedFiles.map((file, idx) => {
                                            // API 응답 구조: fileId, title, detail, uploadDate, filename, url (S3 URL)
                                            // fileId 필드명이 다를 수 있으므로 여러 가능성 체크
                                            const fileId = file.fileId || file.id || file.docId || file.file_id;
                                            const fileName = file.filename || file.title || '제목 없음';
                                            const fileTitle = file.title || fileName;

                                            return (
                                                <tr key={fileId || idx} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '8px' }}>
                                                        <strong>{fileTitle}</strong>
                                                        {fileName !== fileTitle && (
                                                            <div style={{ fontSize: '0.85em', color: '#888', marginTop: '2px' }}>
                                                                파일명: {fileName}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '8px', color: '#666' }}>
                                                        {file.detail || '-'}
                                                    </td>
                                                    <td style={{ padding: '8px', color: '#888', fontSize: '0.9em' }}>
                                                        {formatDate(file.uploadDate)}
                                                    </td>
                                                    <td style={{ padding: '8px' }}>

                                                        {file.url ? (
                                                            <a
                                                                href={file.url}
                                                                download={file.filename || file.title}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: '#007bff', textDecoration: 'none' }}
                                                            >
                                                                다운로드
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#999' }}>다운로드 불가 (URL 없음)</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* 외부 URL 목록 표시 */}
                                {(() => {
                                    // 외부 URL 수집 (urls 배열 또는 url 필드 확인)
                                    const externalUrls = [];
                                    attachedFiles.forEach((file) => {
                                        // urls 배열이 있는 경우
                                        if (Array.isArray(file.urls) && file.urls.length > 0) {
                                            file.urls.forEach(url => {
                                                if (url && url.trim() && !url.includes('s3.amazonaws.com') && !url.includes('teamplate-bucket')) {
                                                    externalUrls.push({ url, title: file.title || '외부 링크' });
                                                }
                                            });
                                        }
                                        // url 필드가 배열인 경우
                                        else if (Array.isArray(file.url) && file.url.length > 0) {
                                            file.url.forEach(url => {
                                                if (url && url.trim() && !url.includes('s3.amazonaws.com') && !url.includes('teamplate-bucket')) {
                                                    externalUrls.push({ url, title: file.title || '외부 링크' });
                                                }
                                            });
                                        }
                                        // url 필드가 문자열인 경우 (S3 URL이 아닌 경우만)
                                        else if (file.url && typeof file.url === 'string' &&
                                            !file.url.includes('s3.amazonaws.com') &&
                                            !file.url.includes('teamplate-bucket') &&
                                            (file.url.startsWith('http://') || file.url.startsWith('https://'))) {
                                            externalUrls.push({ url: file.url, title: file.title || '외부 링크' });
                                        }
                                    });

                                    return externalUrls.length > 0 ? (
                                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                                            <h4>외부 URL</h4>
                                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                                {externalUrls.map((item, idx) => (
                                                    <li key={idx} style={{ marginBottom: '8px' }}>
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#007bff', textDecoration: 'none' }}
                                                        >
                                                            {item.url}
                                                        </a>
                                                        {item.title && item.title !== '외부 링크' && (
                                                            <span style={{ color: '#666', marginLeft: '8px', fontSize: '0.9em' }}>
                                                                ({item.title})
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        ) : (
                            <p style={{ color: '#888', fontStyle: 'italic' }}>첨부된 자료가 없습니다.</p>
                        )}
                    </div>
                </section>
                <footer className="card-footer">
                    {isEditing ? (
                        <>
                            <button
                                className="action-button"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                            >
                                {isSaving ? '저장 중...' : '저장'}
                            </button>
                            <button
                                className="action-button"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                취소
                            </button>
                        </>
                    ) : (
                        <button
                            className="action-button"
                            onClick={() => setIsEditing(true)}
                        >
                            수정
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}

export default AssignmentDetail;
