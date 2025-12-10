/* eslint-disable no-unused-vars */
import './Assignment.css';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { NotificationPopup } from '../../components/NotificationPopup/NotificationPopup';


const baseURL = 'https://www.teamplate-api.site';

const AssignmentCard = ({ item, getAssigneeName, getComplexityLabel, formatDate, handleCheckboxChange, projId }) => {

    const isPast = new Date(item.date * 1000) < new Date();

    const cardClasses = `assignment-card ${isPast ? 'past-due' : ''} ${item.checkBox === 1 ? 'completed' : ''}`;
    const assigneeName = getAssigneeName(item.userName);

    const onCheckboxClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        handleCheckboxChange(item.taskId);
    };

    // item.projId를 우선 사용하고, 없으면 props로 전달된 projId 사용
    const finalProjId = item.projId || projId;
    
    // 디버깅: projId 확인
    if (!finalProjId) {
        console.warn("AssignmentCard: projId가 없습니다.", { item, projId });
    }
    
    return (
        <Link to={`/AssignmentDetail?taskId=${item.taskId}${finalProjId ? `&projId=${finalProjId}` : ''}`} className={cardClasses}>
            <div className="card-status-bar"></div>
            <div className="card-content">
                <div className="card-header">
                    <span className="tag category-tag">{item.cate}</span>
                    <div className="card-checkbox-wrapper" onClick={onCheckboxClick}>
                        <input
                            type="checkbox"
                            checked={item.checkBox === 1}
                            readOnly
                        />
                        <span className="custom-checkbox"></span>
                    </div>
                </div>

                <h4 className="card-title">{item.taskName}</h4>
                <p className="card-description">{item.detail}</p>

                <div className="card-footer">
                    <div className="card-tags">
                        <span className="tag assignee-tag">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            {assigneeName}
                        </span>
                        <span className={`tag complexity-tag level-${item.level}`}>{getComplexityLabel(item.level)}</span>
                    </div>
                    <div className="card-deadline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>{formatDate(item.date)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};


function Assignment({ notifications = [] }) {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const projId = urlParams.get("projectId");
    const currentUserId = localStorage.getItem('userId');
    const [titlePlaceholder, setTitlePlaceholder] = useState('과제명을 적어주세요');
    const [detailPlaceholder, setDetailPlaceholder] = useState('과제의 상세 설명을 적어주세요');
    const [formData, setFormData] = useState({
        taskName: '',
        category: '',
        complexity: 1,
        deadline: '',
        description: '',
        assignee: ''
    });

    const [projectMembers, setProjectMembers] = useState([]);
    const [allAssignments, setAllAssignments] = useState([]);
    const [myAssignments, setMyAssignments] = useState([]);

    const categoryOptions = [
        { value: "", label: "과제분류" },
        { value: "발표", label: "발표" },
        { value: "자료조사", label: "자료조사" },
        { value: "피피티", label: "피피티" }
    ];

    const levelOptions = [
        { value: "", label: "난이도" },
        { value: 1, label: "쉬움" },
        { value: 2, label: "보통" },
        { value: 3, label: "어려움" }
    ];

    useEffect(() => {
        if (!projId) return;
        const fetchProjectMembers = async () => {
            try {
                const response = await fetch(`${baseURL}/member/project/${projId}`);
                if (!response.ok) {
                    throw new Error('프로젝트 멤버 정보를 불러올 수 없습니다.');
                }
                const members = await response.json();
                setProjectMembers(members);
            } catch (error) {
                console.error("프로젝트 멤버 로딩 오류:", error);
                setProjectMembers([]);
            }
        };
        fetchProjectMembers();
    }, [projId]);
    useEffect(() => {
        if (!projId) return;
        const fetchAssignments = async () => {
            try {
                const response = await fetch(`${baseURL}/task/view?projId=${projId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setAllAssignments([]);
                        setMyAssignments([]);
                        return;
                    }
                    throw new Error(`과제 데이터를 불러오지 못했습니다. 상태 코드: ${response.status}`);
                }
                const data = await response.json();
                const fetchedData = Array.isArray(data) ? data : [];
                
                // 디버깅: 첫 번째 항목의 구조 확인
                if (fetchedData.length > 0) {
                    console.log("과제 데이터 샘플:", fetchedData[0]);
                    console.log("첫 번째 과제의 projId:", fetchedData[0].projId);
                }

                const sortedData = sortData(fetchedData);
                setAllAssignments(sortedData);

                if (currentUserId) {

                    const myData = sortedData.filter(item => item.userName === currentUserId);
                    setMyAssignments(myData);
                }

            } catch (error) {
                console.error('과제 불러오기 오류:', error);
                setAllAssignments([]);
                setMyAssignments([]);
            }
        };
        fetchAssignments();
    }, [projId, currentUserId]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            id: currentUserId,
            projId: projId,
            role: null,
            cate: formData.category,
            level: Number(formData.complexity),
            date: new Date(formData.deadline).toISOString(),
            detail: formData.description,
            checkBox: 0,
            taskName: formData.taskName,
            userName: formData.assignee,
            files: [],
        };

        console.log("Submitting Payload:", JSON.stringify(payload, null, 2));

        try {
            const response = await fetch(`${baseURL}/task/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert('과제가 성공적으로 생성되었습니다.');
                window.location.reload();
            } else {
                const errorText = await response.text();
                console.error("과제 생성 실패 원인:", errorText);
                alert(`과제 생성 실패: ${errorText}`);
            }
        } catch (error) {
            console.error('네트워크 오류:', error);
            alert('서버와 연결할 수 없습니다.');
        }
    };

    const sortData = (data) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return [...data].sort((a, b) => {

            if (a.checkBox === 0 && b.checkBox === 1) return -1;
            if (a.checkBox === 1 && b.checkBox === 0) return 1;

            const dateA = new Date(a.date * 1000);
            const dateB = new Date(b.date * 1000);

            return dateA - dateB;
        });
    };


    const handleCheckboxChange = (taskId) => {

        const updatedAssignments = allAssignments.map((item) =>
            item.taskId === taskId ? { ...item, checkBox: item.checkBox === 1 ? 0 : 1 } : item
        );
        const sorted = sortData(updatedAssignments);
        setAllAssignments(sorted);

        if (currentUserId) {
            const myData = sorted.filter(item => item.userName === currentUserId);
            setMyAssignments(myData);
        }
    };


    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString("ko-KR", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hour12: false,
        }).replace(/\. /g, '.').slice(0, -1);
    };


    const getAssigneeName = (assigneeId) => {
        const member = projectMembers.find(m => String(m.id) === String(assigneeId));
        return member ? member.name : 'Unknown';
    };


    const getComplexityLabel = (complexity) => {
        return levelOptions.find(opt => opt.value === complexity)?.label || "알 수 없음";
    };

    return (
        <div className="Assignment">
            <main>
                <div className="center-content">
                    <form className="As-create-form" onSubmit={handleSubmit}>
                        <div className="form-header">
                            <h2>새 과제 생성</h2>
                        </div>
                        <div className="setting-list">
                            <select name="assignee" value={formData.assignee} onChange={handleChange} required>
                                <option value="" disabled>담당자</option>
                                {projectMembers.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value} disabled={option.value === ""}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select name="complexity" value={formData.complexity} onChange={handleChange} required>
                                {levelOptions.map((option) => (
                                    <option key={option.value} value={option.value} disabled={option.value === ""}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input type="datetime-local" name="deadline" value={formData.deadline} onChange={handleChange} required />
                        </div>
                        <div className="containerarea">
                            <div className="As-title">
                                <textarea
                                    name="taskName"
                                    value={formData.taskName}
                                    placeholder={titlePlaceholder}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="As-detail">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    placeholder={detailPlaceholder}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="submit-button">생성</button>
                    </form>

                    <div className="Assignment-look">
                        <div className="my-assignment">
                            <h3>내 과제 보기</h3>
                            <div className="assignments-list">
                                {myAssignments.length > 0 ? (
                                    myAssignments.map((item) => (

                                        <AssignmentCard
                                            key={item.taskId}
                                            item={item}
                                            getAssigneeName={getAssigneeName}
                                            getComplexityLabel={getComplexityLabel}
                                            formatDate={formatDate}
                                            handleCheckboxChange={handleCheckboxChange}
                                            projId={projId}
                                        />
                                    ))
                                ) : (
                                    <p className="no-assignments-msg">내 과제가 없습니다.</p>
                                )}
                            </div>
                        </div>
                        <div className="all-assignment">
                            <h3>전체 과제 보기</h3>
                            <div className="assignments-list">
                                {allAssignments.length > 0 ? (
                                    allAssignments.map((item) => (

                                        <AssignmentCard
                                            key={item.taskId}
                                            item={item}
                                            getAssigneeName={getAssigneeName}
                                            getComplexityLabel={getComplexityLabel}
                                            formatDate={formatDate}
                                            handleCheckboxChange={handleCheckboxChange}
                                            projId={projId}
                                        />
                                    ))
                                ) : (
                                    <p className="no-assignments-msg">등록된 과제가 없습니다.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <NotificationPopup notifications={notifications} />
                </div>
            </main>
        </div>
    );
}

export default Assignment;
