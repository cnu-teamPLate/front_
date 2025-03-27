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
                    <div key={item.id} className={getItemClass(item.date)}>
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
    // id가 본인 id 와 일치하는 경우에만 띄우게끔
    const dummyAssignments = [
        {
            taskId: '1',
            id: '20241099',
            projId: '',
            role: '개발',
            cate: '코딩',
            level: '1',
            date: '2025-03-15',
            detail: '어쩌구 이러쿵 저러쿵 쌸라',
            checkBox: '1'
        },
        {
            taskId: '2',
            id: '20241099',
            projId: '',
            role: '',
            cate: '',
            level: '',
            date: '',
            detail: '',
            checkBox: ''
        },
        {
            id: 3,
            title: 'CSS 레이아웃 연습',
            status: '미완료',
            date: '2025-03-20',
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
        /*
        fetch()
            .then((response) => {
                if (!response.ok) {
                    throw new Error("데이터를 불러오지 못했습니다.");
                }
                return response.json();
            })
            .then((data) => {
                const filteredAssignments = data.filter(
                    (item) => item.id === loggedId//바꿀거임
                );
                setAssignments(filteredAssignments);
            })
            .catch(error) => setError(error.message))
            .finally(() => setLoading(false));
        */
    }, []);

    // 마감일 기준으로 CSS 클래스 적용
    const getItemClass = (date) => {
        const today = new Date();
        const dueDate = new Date(date);
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
                    //로그인 아이디가 동일하면 표시하도록 수정해야함
                    <a href="/AssignmentDetail" className="click-assignment">
                        <div key={item.id} className={getItemClass(item.date)}>
                            <div className = "each">
                                <p className = "each-assignment-title"><strong>{item.taskId}</strong></p>
                                <p className = "each-assignment-kind">{item.cate} / {item.level} / {item.date}</p>
                                <p className = "each-assignment-des">{item.detail}</p>
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
