import React, {useState, useEffect} from 'react';
import {useNavigate } from 'react-router-dom'
import './MyAssignments.css';

const baseURL = "https://teamplate-api.site";
//const getAssignment = `${baseURL}/task/view?projId=${projId}&id=${id}`;

const urlParams = new URLSearchParams(new URL(testURL).search);
const projectId = urlParams.get("projId");
const currentId = urlParams.get("id");
const getAssignment = `${testURL}`;

//폼 입력 시 난이도를 어떤 걸 선택하냐에 따라 숫자 값으로 전달해야줘야함

const MyAssignments = ({ isSidebar = false }) => {
    const navigate = useNavigate();
    // 더미 데이터 (DB 연동 시 fetch로 대체 가능)
    // id가 본인 id 와 일치하는 경우에만 띄우게끔
    const dummyAssignments = [
        {
            "taskId": 1,
            "id": "20241099",
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

    // 과제 데이터 상태 관리 -> 나중에는 데이터를 직접 받아와야함 (밑에 코드))
    const [assignments, setAssignments] = useState(dummyAssignments);

    // 데이터 로드 함수 (DB 연동 시 fetch로 변경 가능)
    const fetchAssignments = async () => {
        // 현재는 더미 데이터 사용, 나중에 API 연동 시 아래 코드 수정
        setAssignments(data);
        //나중에 setAssignments(data)로 변경
        };

    const handleDetail = (data) => {
            fetch(getAssignment, {
              method: "GET",
              headers: {
                "Content-Type": "application/json"
              }
            })
              .then(response => {
                if (!response.ok) {
                  throw {
                    message: "오류 메시지",
                    checkbox: 400,
                    cate: "bad_request"
                  };
                }
                return response.json();
              })
              .then(data => {
                // 여기서 'a' 데이터 존재 여부를 확인
                data.forEach(item => {
                    const taskId = item.taskId;
                })
                if (item.a) {
                  handleDetailWithA(taskId, item.a);
                } else {
                  handleDetailWithoutA(taskId);
                }
              })
              .catch(error => {
                console.error('Error:', error);
                alert(`Error ${error.checkbox}: ${error.message}`);
              });
          };
          
          //여기 좀 이상한 것 같음. 파일이 존재하는 과제를 불러온다는 게 디테일 불러온다는 뜻이 아닌가?
          const handleDetailWithA = (taskId, aValue) => {
            // 예: a가 존재할 때의 API 호출
            fetch`${baseURL}/task/fileupload/view`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ a: aValue })
            }
              .then(res => res.json())
              .then(result => {
                console.log("A 있음:", result);
              });
          };
          
          const handleDetailWithoutA = () => {
            // 예: a가 없을 때의 API 호출
            fetch(`${baseURL}/task/view/${data.taskId}`, {
              method: "GET"
            })
              .then(res => res.json())
              .then(result => {
                console.log("A 없음:", result);
              });
          };
        

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        fetchAssignments();
        
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
            .catch((error) => setError(error.message))
            .finally(() => setLoading(false));
        
    }, []);

    

    // 체크박스 클릭 시 완료/미완료 상태 변경
    const handleCheckboxChange = async (taskId, e) => {
        // 이벤트 전파 방지 (링크 클릭 방지)
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // 현재 상태에서 체크박스 값 확인 (상태 업데이트 전)
        setAssignments((prevAssignments) => {
            const currentItem = prevAssignments.find((item) => item.taskId === taskId);
            const newCheckBoxValue = currentItem?.checkBox === 0 ? 1 : 0;
            
            // API 호출 (상태 업데이트 전에 현재 값으로 호출)
            // API: PUT /task/{taskId}?checkBox={value}
            (async () => {
                try {
                    const apiUrl = `${baseURL}/task/${taskId}?checkBox=${newCheckBoxValue}`;
                    console.log('체크박스 업데이트 API 호출:', apiUrl);
                    
                    const response = await fetch(apiUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                    
                    const responseData = await response.json().catch(() => null);
                    
                    if (response.ok) {
                        console.log("과제 완료 상태 업데이트 성공:", responseData);
                    } else {
                        console.error("과제 완료 상태 업데이트 실패:", responseData);
                        alert(`과제 완료 상태 업데이트 실패: ${responseData?.message || response.status}`);
                        // 실패 시 상태 롤백은 하지 않음 (사용자가 다시 시도할 수 있도록)
                    }
                } catch (error) {
                    console.error("서버 요청 중 오류 발생:", error);
                    alert(`서버 요청 중 오류가 발생했습니다: ${error.message}`);
                }
            })();
            
            const updatedAssignments = prevAssignments.map((item) =>
                item.taskId === taskId ? { ...item, checkBox: newCheckBoxValue } : item
            );

            // 마감일 기준으로 CSS 클래스 적용
            const getItemClass = (date) => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const dueDate = new Date(date*1000);
                return dueDate < today ? 'overdue' : 'upcoming';
            };

            const finalAssignments = updatedAssignments.map((item) => ({
                ...item,
                itemClass: getItemClass(item.date) // ✅ 각 항목에 itemClass 추가
            }));
    
            // ✅ 정렬: 완료된 항목은 아래로, 미완료 항목은 위로
            finalAssignments.sort((a, b) => {
                if (a.checkBox === 0 && b.checkBox === 1) return -1;
                if (a.checkBox === 1 && b.checkBox === 0) return 1;
    
                // 마감일 기준 정렬 (가까운 날짜가 위로)
                const dateA = new Date(a.date * 1000);
                const dateB = new Date(b.date * 1000);
                return dateA - dateB;
            });
    
            return finalAssignments;
        });
    };

    //원래는 해당 과제의 taskId에 맞는 걸로 넘어가야함
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
    //이거 allassignment에도 적용시켜야함... 근데 코드 어차피 통일되어있는데 그냥 
    // all assignment에 있는 걸 갖다가 필터만 걸어서 my로 쓰면 안되나...
    //일단 이미 늦었으니 시간이 덜 걸리는 쪽으로 하자...
    
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
                assignments
                .filter((item) => String(item.id) === currentId)
                .map((item) => (
                    <div key={item.taskId} className={item.itemClass}>
                        <a href={`/AssignmentDetail?taskId=${item.taskId}${item.projId ? `&projId=${item.projId}` : ''}`} className="click-assignment">
                            <div className = "each">
                                <p className = "each-assignment-title"><strong>{item.taskId}</strong></p>
                                <p className = "each-assignment-kind">{item.cate} / {getComplexityLabel(item.level)} / {formatDate(item.date)}</p>
                                <p className = "each-assignment-des">{item.detail}</p>
                            </div>
                        </a>
                        <input 
                            className = "finish-check"
                            type="checkbox"
                            checked={item.checkBox === 1}
                            onChange={(e) => handleCheckboxChange(item.taskId, e)}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                            }}
                        />
                    </div>
                ))
            ) : (
                <p>등록된 과제가 없습니다.</p>
            )}
        </div>
    );
};


export default MyAssignments;
