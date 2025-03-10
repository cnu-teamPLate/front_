import React, {useState, useEffect} from 'react';
import {useNavigate } from 'react-router-dom'
import './MyAssignments.css';


/*
const MyAssignments = ({ myAssignment = [], getItemClass, isSidebar = false  }) => {
    return (
        <div className={`my-assignment ${isSidebar ? 'in-sidebar' : ''}`}>
            <h3>내 과제 보기</h3>
            {myAssignment.length > 0 ? (
                myAssignment.map((item) => (
                    <div key={item.id} className={getItemClass(item.deadline)}>
                        <p>{item.title}</p>
                        <p>{item.status}</p>
                    </div>
                ))
            ) : (
                <p>등록된 과제가 없습니다.</p>
            )}
        </div>
    );
};
*/

const MyAssignments = ({ isSidebar = false }) => {
    const navigate = useNavigate;
    // 더미 데이터 (DB 연동 시 fetch로 대체 가능)
    const dummyAssignments = [
        {
            id: 1,
            title: 'React 프로젝트',
            status: '미완료',
            deadline: '2025-03-15',
            type: '코딩',
            complexity: '어려움',
            description: 'React를 사용하여 TODO 리스트 웹 앱을 개발하는 과제입니다.'
        },
        {
            id: 2,
            title: 'JS 알고리즘 문제 풀기',
            status: '완료',
            deadline: '2025-03-10',
            type: '알고리즘',
            complexity: '보통',
            description: 'JavaScript를 사용하여 알고리즘 문제를 해결하세요.'
        },
        {
            id: 3,
            title: 'CSS 레이아웃 연습',
            status: '미완료',
            deadline: '2025-03-20',
            type: '디자인',
            complexity: '쉬움',
            description: 'CSS Flexbox와 Grid를 사용하여 레이아웃을 구성하세요.'
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
    const getItemClass = (deadline) => {
        const today = new Date();
        const dueDate = new Date(deadline);
        return dueDate < today ? 'overdue' : 'upcoming';
    };

    // 체크박스 클릭 시 완료/미완료 상태 변경
    const handleCheckboxChange = (id) => {
        setAssignments((prevAssignments) =>
            prevAssignments.map((item) =>
                item.id === id ? { ...item, status: item.status === '미완료' ? '완료' : '미완료' } : item
            )
        );
    };

    const handleAssignmentClick = (id) => {
        //navigate(`/assignments/${id}`);
        navigate(`/AssignmentDetail`);
    };

    return (
        <div className={`my-assignment ${isSidebar ? 'in-sidebar' : ''}`}>
            <h3>내 과제 보기</h3>
            {assignments.length > 0 ? (
                assignments.map((item) => (
                    <a href="/AssignmentDetail" className="click-assignment">
                        <div key={item.id} className={getItemClass(item.deadline)}>
                            <div className = "each">
                                <p className = "each-assignment-title"><strong>{item.title}</strong></p>
                                <p className = "each-assignment-kind">{item.type} / {item.complexity} / {item.deadline}</p>
                                <p className = "each-assignment-des">{item.description}</p>
                            </div>
                            <input className = "finish-check"
                                type="checkbox"
                                checked={item.status === '완료'}
                                onChange={() => handleCheckboxChange(item.id)}
                            />
                        </div>
                    </a>
                ))
            ) : (
                <p>등록된 과제가 없습니다.</p>
            )}
        </div>
    );
};


export default MyAssignments;
