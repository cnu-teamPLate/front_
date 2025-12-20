/* eslint-disable no-unused-vars */
import './Assignment.css';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { NotificationPopup } from '../../components/NotificationPopup/NotificationPopup';


const baseURL = 'https://teamplate-api.site';

const AssignmentCard = ({ item, getAssigneeName, getComplexityLabel, formatDate, handleCheckboxChange, projId }) => {

    // 날짜 비교: date가 숫자면 초 단위로 가정, 문자열이면 ISO로 파싱
    let itemDate;
    if (typeof item.date === 'number') {
        itemDate = item.date < 10000000000 ? new Date(item.date * 1000) : new Date(item.date);
    } else {
        itemDate = new Date(item.date);
    }
    const isPast = !isNaN(itemDate.getTime()) && itemDate < new Date();

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
                    const errorData = await response.json().catch(() => null);
                    const errorMsg = errorData?.message || `프로젝트 멤버 정보를 불러올 수 없습니다 (${response.status})`;
                    throw new Error(errorMsg);
                }
                const members = await response.json();
                console.log("=== 📋 프로젝트 멤버 데이터 로드 ===");
                console.log(`총 멤버 수: ${members.length}명`);
                console.log("");
                
                // 각 멤버별 상세 정보 출력
                members.forEach((member, index) => {
                    console.log(`[선택지 ${index + 1}] ${member.name || '이름 없음'}`);
                    console.log(`  └─ ID: ${member.id} (타입: ${typeof member.id})`);
                    console.log(`  └─ 전체 데이터:`, member);
                    console.log("");
                });
                
                // 모든 멤버의 ID 목록
                const memberIds = members.map(m => String(m.id));
                console.log("📌 모든 멤버 ID 목록:", memberIds);
                
                // ID 중복 확인
                const uniqueIds = new Set(memberIds);
                if (memberIds.length !== uniqueIds.size) {
                    console.error("❌ 경고: 중복된 멤버 ID가 있습니다!");
                    console.error("중복된 ID:", memberIds.filter((id, idx) => memberIds.indexOf(id) !== idx));
                } else {
                    console.log("✅ 모든 멤버 ID가 고유합니다.");
                }
                
                // select 옵션에 사용될 value 값 확인
                console.log("");
                console.log("🔍 Select 옵션에 사용될 value 값들:");
                members.forEach((member, index) => {
                    console.log(`  옵션 ${index + 1}: value="${String(member.id)}" → ${member.name}`);
                });
                
                console.log("========================================");
                setProjectMembers(members);
            } catch (error) {
                console.error("프로젝트 멤버 로딩 오류:", error);
                alert(`프로젝트 멤버 정보를 불러올 수 없습니다: ${error.message || '네트워크 오류가 발생했습니다.'}`);
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

                // 디버깅: 모든 과제의 date 값 확인
                if (fetchedData.length > 0) {
                    console.log("=== 서버에서 받은 과제 데이터 ===");
                    console.log("총 과제 수:", fetchedData.length);
                    console.log("현재 시간:", new Date().toISOString());
                    console.log("현재 시간 (Unix 초):", Math.floor(Date.now() / 1000));
                    console.log("");
                    
                    const allDates = [];
                    fetchedData.forEach((item, index) => {
                        console.log(`[과제 ${index + 1}] ${item.taskName || '제목 없음'}`);
                        console.log(`  date 값:`, item.date);
                        console.log(`  date 타입:`, typeof item.date);
                        
                        let parsedDate;
                        if (typeof item.date === 'number') {
                            if (item.date < 10000000000) {
                                parsedDate = new Date(item.date * 1000);
                                console.log(`  파싱 (초 단위):`, parsedDate.toLocaleString('ko-KR'));
                            } else {
                                parsedDate = new Date(item.date);
                                console.log(`  파싱 (밀리초 단위):`, parsedDate.toLocaleString('ko-KR'));
                            }
                        } else if (typeof item.date === 'string') {
                            parsedDate = new Date(item.date);
                            console.log(`  파싱 (ISO 문자열):`, parsedDate.toLocaleString('ko-KR'));
                        }
                        
                        allDates.push({ date: item.date, parsed: parsedDate, taskName: item.taskName });
                        
                        // 현재 시간과 비교
                        const now = new Date();
                        const timeDiff = Math.abs(parsedDate.getTime() - now.getTime());
                        const minutesDiff = timeDiff / (1000 * 60);
                        if (minutesDiff < 1) {
                            console.warn(`  ⚠️ 경고: 현재 시간과 거의 같습니다! (${minutesDiff.toFixed(1)}분 차이)`);
                        }
                        console.log("");
                    });
                    
                    // 모든 날짜가 같은지 확인
                    const uniqueDates = new Set(allDates.map(d => String(d.date)));
                    if (uniqueDates.size === 1 && allDates.length > 1) {
                        console.error('❌ 경고: 모든 과제의 date 값이 동일합니다!', Array.from(uniqueDates)[0]);
                        console.error('이는 서버가 모든 과제에 같은 날짜를 저장했거나 반환하는 문제일 수 있습니다.');
                    }
                    console.log("=====================================");
                }

                const sortedData = sortData(fetchedData);
                setAllAssignments(sortedData);

                if (currentUserId) {
                    // 담당자 ID와 현재 로그인한 유저 ID 비교
                    const myData = sortedData.filter(item => String(item.id) === String(currentUserId));
                    setMyAssignments(myData);
                }

            } catch (error) {
                console.error('과제 불러오기 오류:', error);
                alert(`과제 목록을 불러올 수 없습니다: ${error.message || '네트워크 오류가 발생했습니다.'}`);
                setAllAssignments([]);
                setMyAssignments([]);
            }
        };
        fetchAssignments();
    }, [projId, currentUserId]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        
        // 마감일자 변경 시 디버깅
        if (name === 'deadline') {
            console.log('=== 마감일자 입력 변경 ===');
            console.log('이전 값:', formData.deadline);
            console.log('새로운 값:', value);
            console.log('값 타입:', typeof value);
            console.log('값 길이:', value ? value.length : 0);
            console.log('======================');
        }
        
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // 담당자가 선택되지 않은 경우 확인
        const assigneeId = String(formData.assignee || '').trim();
        if (!assigneeId || assigneeId === '') {
            alert('담당자를 선택해주세요.');
            return;
        }

        // 선택한 담당자 정보 가져오기
        const selectedMember = projectMembers.find(m => String(m.id) === String(assigneeId));
        if (!selectedMember) {
            alert('선택한 담당자를 찾을 수 없습니다.');
            return;
        }
        
        // 마감일자 처리: datetime-local input은 YYYY-MM-DDTHH:mm 형식
        let deadlineDate;
        const deadlineValue = formData.deadline;
        
        console.log('=== 마감일자 처리 ===');
        console.log('formData.deadline 원본:', formData.deadline);
        console.log('deadlineValue:', deadlineValue);
        console.log('deadlineValue 타입:', typeof deadlineValue);
        console.log('deadlineValue 길이:', deadlineValue ? deadlineValue.length : 0);
        console.log('deadlineValue가 빈 문자열인가?', deadlineValue === '');
        console.log('deadlineValue.trim()이 빈 문자열인가?', deadlineValue ? deadlineValue.trim() === '' : true);
        
        if (!deadlineValue || deadlineValue.trim() === '') {
            console.error('❌ 마감일자가 선택되지 않았습니다!');
            alert('마감일자를 선택해주세요.');
            return;
        }
        
        // datetime-local 형식 검증: YYYY-MM-DDTHH:mm 형식이어야 함
        const datetimeLocalPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        if (!datetimeLocalPattern.test(deadlineValue)) {
            console.error('❌ 잘못된 datetime-local 형식:', deadlineValue);
            alert('올바른 마감일자 형식이 아닙니다.');
            return;
        }
        
        // datetime-local 값은 로컬 시간대로 해석됨
        // "2025-01-20T14:30" 형식을 Date 객체로 변환
        const localDate = new Date(deadlineValue);
        console.log('변환된 Date 객체:', localDate);
        console.log('Date 객체가 유효한가?', !isNaN(localDate.getTime()));
        console.log('로컬 시간:', localDate.toLocaleString('ko-KR'));
        console.log('ISO 문자열:', localDate.toISOString());
        
        // 유효성 검사
        if (isNaN(localDate.getTime())) {
            console.error('❌ 날짜 변환 실패! Invalid Date');
            alert('올바른 마감일자를 선택해주세요.');
            return;
        }
        
        // 변환된 날짜가 현재 시간과 같은지 확인 (의도하지 않은 경우 감지)
        const now = new Date();
        const timeDiff = Math.abs(localDate.getTime() - now.getTime());
        const minutesDiff = timeDiff / (1000 * 60);
        console.log('현재 시간과의 차이:', minutesDiff, '분');
        if (minutesDiff < 1) {
            console.warn('⚠️ 경고: 마감일자가 현재 시간과 거의 같습니다!');
            console.warn('선택한 시간:', localDate.toLocaleString('ko-KR'));
            console.warn('현재 시간:', now.toLocaleString('ko-KR'));
        }
        
        deadlineDate = localDate.toISOString();
        console.log('서버에 전송할 날짜 (ISO):', deadlineDate);
        console.log('==================');
        
        const payload = {
            id: String(selectedMember.id),  // 담당자 ID
            projId: projId,
            role: null,
            cate: formData.category,
            level: Number(formData.complexity),
            date: deadlineDate,
            detail: formData.description,
            checkBox: 0,
            taskName: formData.taskName,
            userName: String(selectedMember.name),  // 담당자 이름
            files: [],
        };
        
        console.log("=== 과제 생성 Payload ===");
        console.log("담당자 ID (id):", payload.id);
        console.log("담당자 이름 (userName):", payload.userName);
        console.log("마감일자 (date):", payload.date);
        console.log("전체 Payload:", JSON.stringify(payload, null, 2));
        console.log("========================");

        try {
            const response = await fetch(`${baseURL}/task/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const responseData = await response.json().catch(() => null);
                console.log('=== 📥 과제 생성 서버 응답 ===');
                console.log('응답 Status:', response.status);
                console.log('응답 Data:', responseData);
                if (responseData) {
                    console.log('서버가 반환한 date 값:', responseData.date);
                    console.log('전송한 date 값:', payload.date);
                    if (responseData.date && responseData.date !== payload.date) {
                        console.error('❌ 경고: 서버가 다른 날짜를 반환했습니다!');
                        console.error('전송한 날짜:', payload.date);
                        console.error('서버가 반환한 날짜:', responseData.date);
                    } else {
                        console.log('✅ 서버가 전송한 날짜를 그대로 반환했습니다.');
                    }
                }
                console.log('============================');
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

            // 날짜 비교: date가 숫자면 초 단위로 가정, 문자열이면 ISO로 파싱
            const getDate = (dateValue) => {
                if (typeof dateValue === 'number') {
                    return dateValue < 10000000000 ? new Date(dateValue * 1000) : new Date(dateValue);
                } else {
                    return new Date(dateValue);
                }
            };
            const dateA = getDate(a.date);
            const dateB = getDate(b.date);

            return dateA - dateB;
        });
    };


    const handleCheckboxChange = async (taskId) => {
        // 현재 체크박스 상태 확인
        const currentItem = allAssignments.find(item => item.taskId === taskId);
        if (!currentItem) {
            console.error('체크박스 변경: 과제를 찾을 수 없습니다. taskId:', taskId);
            return;
        }

        // 새로운 체크박스 상태 (토글)
        const newCheckBoxValue = currentItem.checkBox === 1 ? 0 : 1;
        
        console.log('=== ✅ 체크박스 변경 요청 ===');
        console.log('taskId:', taskId);
        console.log('현재 checkBox 값:', currentItem.checkBox);
        console.log('변경할 checkBox 값:', newCheckBoxValue);
        console.log('요청 URL:', `${baseURL}/task/${taskId}?checkBox=${newCheckBoxValue}`);
        console.log('===========================');

        // 먼저 로컬 상태 업데이트 (낙관적 업데이트)
        const updatedAssignments = allAssignments.map((item) =>
            item.taskId === taskId ? { ...item, checkBox: newCheckBoxValue } : item
        );
        const sorted = sortData(updatedAssignments);
        setAllAssignments(sorted);

        if (currentUserId) {
            // 담당자 ID와 현재 로그인한 유저 ID 비교
            const myData = sorted.filter(item => String(item.id) === String(currentUserId));
            setMyAssignments(myData);
        }

        // 서버에 체크박스 상태 변경 요청
        try {
            const response = await fetch(`${baseURL}/task/${taskId}?checkBox=${newCheckBoxValue}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('=== 📥 체크박스 변경 서버 응답 ===');
            console.log('응답 Status:', response.status);
            
            if (response.ok) {
                const responseData = await response.json().catch(() => null);
                console.log('응답 Data:', responseData);
                console.log('✅ 체크박스 상태가 서버에 저장되었습니다.');
            } else {
                const errorText = await response.text();
                console.error('❌ 체크박스 변경 실패:', errorText);
                console.error('응답 Status:', response.status);
                // 실패 시 원래 상태로 되돌리기
                const revertedAssignments = allAssignments.map((item) =>
                    item.taskId === taskId ? { ...item, checkBox: currentItem.checkBox } : item
                );
                const revertedSorted = sortData(revertedAssignments);
                setAllAssignments(revertedSorted);
                if (currentUserId) {
                    // 담당자 ID와 현재 로그인한 유저 ID 비교
                    const myData = revertedSorted.filter(item => String(item.id) === String(currentUserId));
                    setMyAssignments(myData);
                }
                alert(`체크박스 변경 실패: ${errorText}`);
            }
            console.log('================================');
        } catch (error) {
            console.error('❌ 체크박스 변경 네트워크 오류:', error);
            // 실패 시 원래 상태로 되돌리기
            const revertedAssignments = allAssignments.map((item) =>
                item.taskId === taskId ? { ...item, checkBox: currentItem.checkBox } : item
            );
            const revertedSorted = sortData(revertedAssignments);
            setAllAssignments(revertedSorted);
            if (currentUserId) {
                const myData = revertedSorted.filter(item => String(item.userName) === String(currentUserId));
                setMyAssignments(myData);
            }
            alert('서버와 연결할 수 없습니다.');
        }
    };


    const formatDate = (dateValue) => {
        // dateValue가 숫자(Unix timestamp 초 단위)인지 문자열(ISO)인지 확인
        let date;
        
        if (typeof dateValue === 'number') {
            // 숫자인 경우: 10자리 이하면 초 단위, 그 이상이면 밀리초 단위
            if (dateValue < 10000000000) {
                date = new Date(dateValue * 1000); // 초 단위
            } else {
                date = new Date(dateValue); // 밀리초 단위
            }
        } else if (typeof dateValue === 'string') {
            // 문자열인 경우: ISO 형식으로 파싱
            date = new Date(dateValue);
        } else {
            console.error('formatDate: 알 수 없는 날짜 형식:', dateValue, typeof dateValue);
            return '날짜 오류';
        }
        
        if (isNaN(date.getTime())) {
            console.error('formatDate: 날짜 파싱 실패:', dateValue, '→', date);
            return '날짜 오류';
        }
        
        return date.toLocaleString("ko-KR", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hour12: false,
        }).replace(/\. /g, '.').slice(0, -1);
    };


    const getAssigneeName = (assigneeIdOrName) => {
        if (!assigneeIdOrName) return 'Unknown';
        
        // 먼저 ID로 찾기
        let member = projectMembers.find(m => 
            String(m.id) === String(assigneeIdOrName) || 
            m.id === assigneeIdOrName
        );
        
        // ID로 못 찾았으면 이름으로 찾기
        if (!member) {
            member = projectMembers.find(m => 
                String(m.name) === String(assigneeIdOrName)
            );
        }
        
        // 찾았으면 이름 반환
        if (member) {
            return member.name;
        }
        
        // 못 찾았으면 이미 이름일 수도 있으니 그대로 반환
        return String(assigneeIdOrName);
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
                            <select 
                                name="assignee" 
                                value={formData.assignee} 
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    const selectedMember = projectMembers.find(m => String(m.id) === String(selectedValue));
                                    
                                    console.log("=== 👤 담당자 선택 ===");
                                    console.log(`선택된 값: "${selectedValue}" (타입: ${typeof selectedValue})`);
                                    
                                    if (selectedMember) {
                                        console.log(`✅ 선택된 멤버: ${selectedMember.name}`);
                                        console.log(`   └─ ID: ${selectedMember.id} (타입: ${typeof selectedMember.id})`);
                                        console.log(`   └─ 전체 데이터:`, selectedMember);
                                    } else {
                                        console.error("❌ 선택된 값에 해당하는 멤버를 찾을 수 없습니다!");
                                        console.error("   사용 가능한 멤버 ID:", projectMembers.map(m => m.id));
                                    }
                                    console.log("====================");
                                    
                                    handleChange(e);
                                }}
                                required
                            >
                                <option value="" disabled>담당자</option>
                                {projectMembers.map((member, index) => {
                                    // 첫 번째 렌더링 시에만 옵션 정보 출력 (중복 방지)
                                    if (index === 0 && projectMembers.length > 0) {
                                        console.log("=== 📝 Select 옵션 렌더링 ===");
                                        projectMembers.forEach((m, idx) => {
                                            console.log(`옵션 ${idx + 1}: value="${String(m.id)}" → ${m.name}`);
                                        });
                                        console.log("=============================");
                                    }
                                    return (
                                        <option key={member.id} value={String(member.id)}>
                                            {member.name}
                                        </option>
                                    );
                                })}
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
                </div>
            </main>
        </div>
    );
}

export default Assignment;
