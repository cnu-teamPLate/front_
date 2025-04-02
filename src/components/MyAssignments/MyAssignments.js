import React, {useState, useEffect} from 'react';
import {useNavigate } from 'react-router-dom'
import './MyAssignments.css';

//폼 입력 시 난이도를 어떤 걸 선택하냐에 따라 숫자 값으로 전달해야줘야함

const MyAssignments = ({ isSidebar = false }) => {
    const navigate = useNavigate;
    // 더미 데이터 (DB 연동 시 fetch로 대체 가능)
    // id가 본인 id 와 일치하는 경우에만 띄우게끔
    const dummyAssignments = [
        {
            "taskId": 1,
            "id": "20240000",
            "projId": "CSE00001",
            "name": "김지홍",
            "cate": "발표",
            "level": 1,
            "date": "1739620235.000000000",
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
            "date": '1739620236.000000000',
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

    const handleAssignmentClick = (id) => {
        //navigate(`/assignments/${id}`);
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
    //이거 allassignment에도 적용시켜야함... 근데 코드 어차피 통일되어있는데 그냥 
    // all assignment에 있는 걸 갖다가 필터만 걸어서 my로 쓰면 안되나...
    
    const getComplexityLabel = (complexity) => {
        const labels = {
            1: "쉬움",
            2: "보통",
            3: "어려움"
        };
        return labels[complexity] || "알 수 없음"; // 예외 처리
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
                                <p className = "each-assignment-kind">{item.cate} / {getComplexityLabel(item.level)} / {formatDate(item.date)}</p>
                                <p className = "each-assignment-des">{item.detail}</p>
                            </div>
                            <input className = "finish-check"
                                type="checkbox"
                                checked={item.checkBox === 1}
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
