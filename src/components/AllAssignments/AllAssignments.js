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
            "date": "2025-01-01",
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
            "date": '2025-01-01',
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
    const handleCheckboxChange = (taskId) => {
        setAssignments((prevAssignments) =>
            prevAssignments.map((item) =>
                item.taskId === taskId ? { ...item, status: item.status === '미완료' ? '완료' : '미완료' } : item
            )
        );
    };

    const handleAssignmentClick = (taskId) => {
        //navigate(`/assignments/${taskId}`);
        navigate(`/AssignmentDetail`);
    };

    return (
        <div className={`all-assignment ${isSidebar ? 'in-sidebar' : ''}`}>
            <h3>전체 과제 보기</h3>
            {assignments.length > 0 ? (
                assignments.map((item) => (
                    <a href="/AssignmentDetail" className="click-assignment">
                        <div key={item.id} className={getItemClass(item.date)}>
                            <div className = "each">
                                <p className = "each-assignment-title"><strong>{item.taskId}</strong></p>
                                <p className = "each-assignment-kind">{item.name} / {item.cate} / {item.level} / {item.date}</p>
                                <p className = "each-assignment-des">{item.detail}</p>
                            </div>
                            {
                                //체크박스 값이 0인게 미완료인가? -> 0일 경우 위로, 1일 경우 아래로 가도록 코드 짜기
                            <input className = "finish-check"
                                type="checkbox"
                                checked={item.checkBox === '1'}
                                onChange={() => handleCheckboxChange(item.id)}
                            />
                            }
                        </div>
                    </a>
                ))
            ) : (
                <p>등록된 과제가 없습니다.</p>
            )}
        </div>
    );
};


export default AllAssignments;
