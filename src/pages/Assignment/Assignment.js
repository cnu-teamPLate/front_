/* eslint-disable no-unused-vars */
import './Assignment.css';
import React, { useState, useEffect } from 'react';
import { NotificationPopup } from '../../components/NotificationPopup/NotificationPopup';
import MyAssignments from '../../components/MyAssignments/MyAssignments';
import AllAssignments from '../../components/AllAssignments/AllAssignments';

const baseURL = "http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080";

// 쿼리 파라미터에서 projectId, id(사용자) 추출
const urlParams = new URLSearchParams(window.location.search);
const projId = urlParams.get("projectId");
const currentUserId = localStorage.getItem('userId');;

function Assignment({ notifications = [] }) {
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
        if (!projId || !currentUserId) return;
        const fetchAssignments = async () => {
            try {
                const response = await fetch(`${baseURL}/task/view?projId=${projId}&id=${currentUserId}`);
                if (!response.ok) {
                    throw new Error(`과제 데이터를 불러오지 못했습니다. 상태 코드: ${response.status}`);
                }
                const data = await response.json();
                const fetchedData = Array.isArray(data) ? data : [];
                
                const sortedData = sortData(fetchedData);
                setAllAssignments(sortedData);

                const myData = sortedData.filter(item => item.userName === currentUserId);
                setMyAssignments(myData);

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

        // payload 객체
        /* 
        과제 생성 API (/task/post)에서 Task 엔티티를 데이터베이스에 저장할 때, 
        taskId가 자동으로 생성되지 않고 0으로 저장되어 Duplicate entry 오류가 발생
        Task 엔티티의 taskId 필드에 ID 자동 생성 전략 어노테이션을 확인하고 추가 필요
        */
        const payload = {

            id: currentUserId,                      // 현재 사용자 ID
            projId: projId,                         // 프로젝트 ID
            role: null,                             // role은 현재 폼에 없으므로 null 처리
            cate: formData.category,
            level: Number(formData.complexity),
            date: new Date(formData.deadline).toISOString(), 
            detail: formData.description,
            checkBox: 0,                            // 새 과제이므로 checkBox 상태는 0(미완료)으로 설정
            taskName: formData.taskName,
            userName: formData.assignee,            // 담당자 ID
            files: [],                              // 새 과제이므로 빈 파일 목록 전송
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

    // Unix 타임스탬프 기준 정렬 함수
    const sortData = (data) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return [...data].sort((a, b) => {
            const dateA = new Date(a.date * 1000);
            const dateB = new Date(b.date * 1000);
            const isPastA = dateA < now;
            const isPastB = dateB < now;

            if (isPastA && !isPastB) return 1;
            if (!isPastA && isPastB) return -1;
            if (isPastA && isPastB) return dateB - dateA;
            return dateA - dateB;
        });
    };

    // 마감일 경과 여부 CSS 클래스 반환 함수
    const getItemClass = (itemDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const itemDateTime = new Date(itemDate * 1000);
        return itemDateTime < today ? 'look-item past-date' : 'look-item';
    };

    return (
        <div className="Assignment">
            <main>
                <div className="center-content">
                    <form className="As-create-form" onSubmit={handleSubmit}>
                        <div className="setting-list">
                            {/* [수정] 담당자 목록을 새로운 API 응답 형식(id, name)에 맞춰 렌더링 */}
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
                            <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required />
                        </div>
                        <div className="container">
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
                        <MyAssignments myAssignment={myAssignments} getItemClass={getItemClass} isSidebar={false} />
                        <AllAssignments allAssignment={allAssignments} getItemClass={getItemClass} />
                    </div>
                    <NotificationPopup notifications={notifications} />
                </div>
            </main>
        </div>
    );
}

export default Assignment;