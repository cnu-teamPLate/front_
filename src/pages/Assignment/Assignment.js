import './Assignment.css';
import React, { useState, useEffect } from 'react';
import { NotificationPopup } from '../../components/NotificationPopup/NotificationPopup';
import MyAssignments from '../../components/MyAssignments/MyAssignments';
import AllAssignments from '../../components/AllAssignments/AllAssignments';

const baseURL = "http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080";
/* 실사용 시 이쪽 코드를 사용

const urlParams = new URLSearchParams(window.location.search);
const projId = urlParams.get("projectId");
const id = urlParams.get("id");
const getAssignment = `${baseURL}/task/view?projId=${projId}&id=${id}`;
*/

const testURL = "http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/task/view?projId=CSE00001&id=20241099";
const urlParams = new URLSearchParams(new URL(testURL).search);
const projectId = urlParams.get("projId");
const id = urlParams.get("id");
const getAssignment = `${testURL}`;
/*

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
    .then(data => console.log(data))
    .catch(error => {
        console.error('Error:', error);
        alert(`Error ${error.checkbox}: ${error.message}`);
    });
    */

function Assignment({ onSubmit = () => { }, currentUser = "", notifications = [] }) {
    const [titlePlaceholder, setTitlePlaceholder] = useState('과제명을 적어주세요');
    const [detailPlaceholder, setDetailPlaceholder] = useState('과제의 상세 설명을 적어주세요');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // 초기값을 빈 문자열로 설정 (작성 후 제출 시 다시 빈 값으로 리셋)
    const [formData, setFormData] = useState({
        taskName: '',
        category: '',
        complexity: 1,
        deadline: '',
        description: '',
        assignee: ''
    });

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

    const assigneeOptions = [
        { value: "", label: "담당자" },
        { value: "김지훈", label: "김지훈" },
        { value: "박서준", label: "박서준" },
        { value: "이수민", label: "이수민" }
    ];

    const [submittedData, setSubmittedData] = useState([]);
    const [ids, setids] = useState([]);

    // 현재 사용자와 관련된 ID를 불러오는 useEffect
    // useEffect(() => {
    //     const fetchids = async () => {
    //         try {
    //             const response = await fetch('/api/ids');
    //             if (!response.ok) {
    //                 throw new Error('Network response was not ok');
    //             }
    //             const data = await response.json();
    //             const userids = data.filter(item => item.userId === currentUser);
    //             setids(userids);
    //         } catch (error) {
    //             console.error('Error fetching ids:', error);
    //             setids([]);
    //         }
    //     };
    //     fetchids();
    // }, [currentUser]);

    const handleFocus = (field) => {
        if (field === 'taskName') {
            setTitlePlaceholder('');
        } else if (field === 'description') {
            setDetailPlaceholder('');
        }
    };

    const handleBlur = (field) => {
        if (field === 'taskName' && (!formData.taskName || formData.taskName.trim() === '')) {
            setTitlePlaceholder('과제명을 적어주세요');
        } else if (field === 'description' && (!formData.description || formData.description.trim() === '')) {
            setDetailPlaceholder('과제의 상세 설명을 적어주세요');
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const submittedDataObj = {
            taskName: formData.taskName,
            cate: formData.category,
            complexity: formData.complexity,
            deadline: formData.deadline,
            description: formData.description,
            assignee: formData.assignee,
        };
        console.log(submittedDataObj);

        try {
            const response = await fetch(`${baseURL}/task/post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                const responseData = await response.json();
                console.log('서버 응답:', responseData);
                alert('200 ok');
            } else {
                if (response.status === 400) {
                    alert("bad_request");
                }
            }
        } catch (error) {
            console.error('네트워크 오류 또는 기타 예외:', error);
            alert('서버와 연결할 수 없습니다.');
        }

        // 제출 후 폼을 초기 상태로 리셋
        setFormData({
            taskName: '',
            category: '',
            complexity: 1,
            deadline: '',
            description: '',
            assignee: ''
        });
        setTitlePlaceholder('과제명을 적어주세요');
        setDetailPlaceholder('과제의 상세 설명을 적어주세요');
    };

    const sortData = (data) => {
        const today = new Date().toISOString().split('T')[0];
        return data.sort((a, b) => {
            if (a.date < today && b.date < today) return new Date(b.date) - new Date(a.date);
            if (a.date < today) return -1;
            if (b.date < today) return 1;
            return new Date(a.date) - new Date(b.date);
        });
    };

    const myAssignment = sortData(submittedData) || [];
    const allAssignment = sortData(submittedData) || [];

    const getItemClass = (date) => {
        const today = new Date().toISOString().split('T')[0];
        return date < today ? 'look-item past-date' : 'look-item';
    };

    return (
        <div className="Assignment">
            <main>
                <div className="center-content">
                    <form className="As-create-form" onSubmit={handleSubmit}>
                        <div className="setting-list">
                            <select
                                name="assignee"
                                value={formData.assignee}
                                onChange={handleChange}
                            >
                                {assigneeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="complexity"
                                value={formData.complexity}
                                onChange={handleChange}
                            >
                                {levelOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="container">
                            <div className="As-title">
                                <textarea
                                    name="taskName"
                                    value={formData.taskName}
                                    placeholder={titlePlaceholder}
                                    onFocus={() => handleFocus('taskName')}
                                    onBlur={() => handleBlur('taskName')}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="As-detail">
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    placeholder={detailPlaceholder}
                                    onFocus={() => handleFocus('description')}
                                    onBlur={() => handleBlur('description')}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <button className="submit-button">생성</button>
                    </form>
                    <div className="Assignment-look">
                        <MyAssignments myAssignment={myAssignment} getItemClass={getItemClass} isSidebar={false} />
                        <AllAssignments allAssignment={allAssignment} getItemClass={getItemClass} />
                    </div>
                    <NotificationPopup notifications={notifications} />
                </div>
            </main>
        </div>
    );
}

export default Assignment;
