import React, {useState, useEffect} from 'react';
import {useNavigate } from 'react-router-dom'
import './AllAssignments.css';

//일단 현재 페이지의 프로젝트 아이디랑 사용자 아이디를 특정 것으로 해두고, 
// 아이디 비교해서 내것만 띄우는게 가능한지 체크

//일단 지금 과제명에 대한 값을 반환을 안해주는 상황임 -> 추가 가능한지?
//레벨은 1,2,3으로 표시되는 것 같은데 어떤 숫자를 주냐에 따라 쉬움 보통 어려움을 표시하게 코드를 짜야하는지?
//날짜 관련해서 저 숫자 받으면 어떻게 처리해야하는지?

const AllAssignments = ({ isSidebar = false }) => {
    const navigate = useNavigate;
    // 더미 데이터 (DB 연동 시 fetch로 대체 가능)
    const dummyAssignments = [
        {
            "taskId": 1,
            "id": "20240000",
            "projId": "CSE00001",
            "name": "김지홍",
            "cate": "발표",
            "level": 1,
            "date": "1232847931",
            "detail": "이러쿵",
            "checkBox": 1
        },
        {
            "taskId": 2,
            "id": "00000000",
            "projId": "CSE00001",
            "name": "김서강",
            "cate": "PPT",
            "level": 2,
            "date": '172839281',
            "detail": "어쩌구",
            "checkBox": 0
        },
        {
            "taskId": 3,
            "id": "20241099",
            "projId": "CSE00001",
            "name": "홍길동",
            "cate": "PPT",
            "level": 2,
            "date": "1739620234.000000000",
            "detail": "Spring Boot API 개발",
            "checkBox": 0
        }
    ];

    // 과제 데이터 상태 관리
    const [assignments, setAssignments] = useState([]);

    // 데이터 로드 함수 (DB 연동 시 fetch로 변경 가능)
    const fetchAssignments = async () => {
        // 현재는 더미 데이터 사용, 나중에 API 연동 시 아래 코드 수정
        setAssignments(dummyAssignments);
        //나중에 setAssignments(data)로 변경
        };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchAssignments();
    }, []);

    // 마감일 기준으로 CSS 클래스 적용
    const getItemClass = (date) => {
        const today = new Date();
        const dueDate = new Date(date);
        return dueDate < today ? 'overdue' : 'upcoming';
    };

    // 체크박스 클릭 시 완료/미완료 상태 변경
    const handleCheckboxChange = (id) => {
        setAssignments((prevAssignments) => {
            const updatedAssignments = prevAssignments.map((item) =>
                item.id === id ? { ...item, checkBox: item.checkBox === 0 ? 1 : 0 } : item
            );
            return updatedAssignments.sort((a,b) => {
                if(a.checkBox === 0 && b.checkBox === 1) return -1;
                if(a.checkBox === 1 && b.checkBox === 0) return 1;

                const dateA = new Date(a.date * 1000);
                const dateB = new Date(b.date * 1000);
                return dateA - dateB;
            });
                
        
        });
    };

    const handleAssignmentClick = (taskId) => {
        //navigate(`/assignments/${taskId}`);
        navigate(`/AssignmentDetail`);
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000); // 초 단위를 밀리초로 변환
        return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false, // 24시간 형식
        });
    };

    const getComplexityLabel = (complexity) => {
        const labels = {
            1: "쉬움",
            2: "보통",
            3: "어려움"
        };
        return labels[complexity] || "알 수 없음"; // 예외 처리
    };

    return (
        <div className={`all-assignment ${isSidebar ? 'in-sidebar' : ''}`}>
            <h3>전체 과제 보기</h3>
            {assignments.length > 0 ? (
                assignments.map((item) => (
                    <div key={item.id} className={getItemClass(item.date)}>
                        <a href="/AssignmentDetail" className="click-assignment">
                        
                            <div className = "each">
                                <p className = "each-assignment-title"><strong>{item.taskId}</strong></p>
                                <p className = "each-assignment-kind">{item.name} / {item.cate} / {getComplexityLabel(item.level)} / {formatDate(item.date)}</p>
                                <p className = "each-assignment-des">{item.detail}</p>
                            </div>
                            {
                                //체크박스 값이 0인게 미완료인가? -> 0일 경우 위로, 1일 경우 아래로 가도록 코드 짜기
                            <input className = "finish-check"
                                type="checkbox"
                                checked={item.checkBox === 1}
                                onChange={() => handleCheckboxChange(item.id)}
                            />
                            }
                        
                        </a>
                    </div>
                ))
            ) : (
                <p>등록된 과제가 없습니다.</p>
            )}
        </div>
    );
};


export default AllAssignments;
