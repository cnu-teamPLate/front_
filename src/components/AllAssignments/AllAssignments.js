import React, {useState, useEffect} from 'react';
import {useNavigate } from 'react-router-dom'
import './AllAssignments.css';


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

const AllAssignments = ({ isSidebar = false }) => {
    const navigate = useNavigate;
    // 더미 데이터 (DB 연동 시 fetch로 대체 가능)
    const dummyAssignments = [
        {
            taskId: '1',
            id: '1',
            projId: '1',
            role: '1',
            cate: '1',
            level: '1',
            date: '1',
            detail: '1',
            checkBox: '1'
        },
        {
            taskId: '',
            id: '',
            projId: '',
            role: '',
            cate: '',
            level: '',
            date: '',
            detail: '',
            checkBox: ''
        },
        {
            taskId: '',
            id: '',
            projId: '',
            role: '',
            cate: '',
            level: '',
            date: '',
            detail: '',
            checkBox: ''
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
                                <p className = "each-assignment-kind">{item.role} / {item.cate} / {item.level} / {item.date}</p>
                                <p className = "each-assignment-des">{item.detail}</p>
                            </div>
                            {/*}
                            <input className = "finish-check"
                                type="checkbox"
                                checked={item.checkBox === '1'}
                                onChange={() => handleCheckboxChange(item.id)}
                            />
                            */}
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
