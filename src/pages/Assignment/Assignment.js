import './Assignment.css';
import React, { useState, useEffect } from 'react';
import { NotificationPopup } from '../../components/NotificationPopup/NotificationPopup';
import MyAssignments from '../../components/MyAssignments/MyAssignments';
import AllAssignments from '../../components/AllAssignments/AllAssignments';

//const urlParams = "./task/view?projId=CSE00001&id=20241099"
//const projId = urlParams.get("projectId");
//const userId = urlParams.get("id");

/*fetch(getAssignment, {
    method : "GET",
    headers : {
        "Content-Type": "application/json"
    }
})
.then(response => {
    if(!response.ok) {
        throw {
            messeage: "오류 메시지",
            checkbox : 400,
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

    const [formData, setFormData] = useState({
        "taskName": "발표 준비",
        "category": "피피티",
        "complexity": 3,
        "deadline": "2025-02-10T23:59:59",
        "description": "팀 프로젝트 정리",
        "assignee": "김지훈"
    })

    const [submittedData, setSubmittedData] = useState([]);

    const [ids, setids] = useState([]);

    useEffect(() => {
        const fetchids = async () => {
            try {
                const response = await fetch('/api/ids');
                if (!response.ok) {
                    throw new Error('Network reponse was not ok');
                }
                const data = await response.json();
                const userids = data.filter(id => id.userId === currentUser);
                setids(userids);
            } catch (error) {
                console.error('Error fetching ids:', error);
                setids([]);
            }
        };
        fetchids();
    }, [currentUser]);

    const handleFocus = (field) => {
        if (field === 'title') {
            setTitlePlaceholder('');
        } else if (field === 'detail') {
            setDetailPlaceholder('');
        }
    };

    const handleBlur = (field) => {
        if (field === 'title' && (!formData.title || formData.title.trim() === '')) {
            setTitlePlaceholder('과제의 상세 설명을 적어주세요');
        } else if (field === 'detail' && (!formData.detail || formData.detail.trim() === '')) {
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

    const newSubmittedData = {
        ...formData,
        date: formData.date || '미정',
        id: formData.id,
        checkbox: '0', // 기본 상태 설정
        date: new Date().getTime(), // 고유한 ID 생성
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Current formData:', formData);
        const submittedData = {
            ...formData,
            date: formData.date || '미정',
            id: formData.id,
            checkbox: '0',
            date: new Date().getTime(),
        };
        console.log(submittedData);

        setSubmittedData((prevData) => [...prevData, newSubmittedData]);

        onSubmit(formData);
        setFormData({
            title: '',
            detail: '',
            id: '',
            cate: '',
            level: '',
            date: ''
        });
        setTitlePlaceholder('과제명을 적어주세요');
        setDetailPlaceholder('과제의 상세 설명을 적어주세요');
    };

    const toggleSidebar = () => {
        console.log("🚀 토글 버튼이 클릭됨!"); // ✅ 버튼이 클릭되는지 확인
        setSidebarOpen(!sidebarOpen);
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

    const myAssignment = sortData(submittedData.filter(item => item.id === currentUser)) || [];
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
                                name='id'
                                value={formData.id}
                                onChange={handleChange}
                            >
                                <option value="">담당자</option>
                                {ids.map((id) => (
                                    <option key={id.id} value={id.name}>
                                        {id.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                name='cate'
                                value={formData.cate}
                                onChange={handleChange}
                            >
                                <option value="">과제분류</option>
                                <option vlaue="발표">발표</option>
                                <option vlaue="자료조사">자료조사</option>
                                {/*이부분도 분류 대강 짠 다음에 추가해야함*/}
                            </select>
                            <select
                                name='level'
                                value={formData.level}
                                onChange={handleChange}
                            >
                                <option value='-'>과제 복잡도</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                            </select>
                            <input
                                type="date"
                                name='date'
                                value={formData.date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="container">
                            <div className="As-title">
                                <textarea
                                    cate="text"
                                    name="title"
                                    value={formData.title}
                                    placeholder={titlePlaceholder}
                                    onFocus={() => handleFocus('title')}
                                    onBlur={() => handleBlur('title')}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="As-detail">
                                <textarea
                                    type="text"
                                    name="detail"
                                    value={formData.detail}
                                    placeholder={detailPlaceholder}
                                    onFocus={() => handleFocus('detail')}
                                    onBlur={() => handleBlur('detail')}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <button className="submit-button">생성</button>
                    </form>
                    <div className="Assignment-look">
            {/* ✅ 내 과제 보기 컴포넌트 */}
            <MyAssignments myAssignment={myAssignment} getItemClass={getItemClass} />
            <AllAssignments allAssignment={allAssignment} getItemClass={getItemClass} />

                        
                        {/*<div className="all-assignment">
                            <h3>전체 과제 보기</h3>
                            {allAssignment.map(item => (
                                <div
                                    key={item.id}
                                    className={getItemClass(item.date)}
                                >
                                    <p>{item.title}</p>
                                    <p>{item.id}</p>
                                    <p>{item.checkbox}</p>
                                </div>
                            ))}
                        </div>
                        */}
                    </div>
                    <NotificationPopup notifications={notifications} />
                </div>
            </main>

        </div>

    )
}

export default Assignment;