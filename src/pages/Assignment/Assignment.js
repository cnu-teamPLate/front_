import './Assignment.css';
import React, { useState, useEffect } from 'react';
import { IoMenu, IoPerson} from "react-icons/io5";
import { NotificationPopup } from '../../components/NotificationPopup/NotificationPopup';

function Assignment({onSubmit = () => {}, currentUser = "", notifications = []}) {
    const [titlePlaceholder, setTitlePlaceholder] = useState('과제명을 적어주세요');
    const [detailPlaceholder, setDetailPlaceholder] = useState('과제의 상세 설명을 적어주세요');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [formData, setFormData] = useState({
        title:'',
        detail:'',
        manager:'',
        type:'',
        diff:'',
        deadline:''
    })

    const [submittedData, setSubmittedData] = useState([]);

    const [managers, setManagers] = useState([]);

    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const response = await fetch('/api/managers');
                if (!response.ok) {
                    throw new Error('Network reponse was not ok');
                }
                const data = await response.json();
                const userManagers = data.filter(manager => manager.userId === currentUser);
                setManagers(userManagers);
            } catch (error) {
                console.error('Error fetching managers:', error);
                setManagers([]);
            }
        };
        fetchManagers();
    }, [currentUser]);
        

    const handleFocus = (field) => {
        if (field==='title') {
            setTitlePlaceholder('');
        } else if (field==='detail') {
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
        deadline: formData.deadline || '미정',
        manager: formData.manager,
        status: '미완료', // 기본 상태 설정
        id: new Date().getTime(), // 고유한 ID 생성
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Current formData:', formData);
        const submittedData = {
            ...formData,
            deadline: formData.deadline || '미정',
            manager: formData.manager,
            status: '미완료',
            id: new Date().getTime(),
          };
        console.log(submittedData);

        setSubmittedData((prevData) => [...prevData, newSubmittedData]);

        onSubmit(formData);
        setFormData({
            title:'',
            detail:'',
            manager:'',
            type:'',
            diff:'',
            deadline:''
        });
        setTitlePlaceholder('과제명을 적어주세요');
        setDetailPlaceholder('과제의 상세 설명을 적어주세요');
    };

    

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const sortData = (data) => {
        const today = new Date().toISOString().split('T')[0];
        return data.sort((a, b) => {
            if (a.deadline < today && b.deadline < today)return new Date(b.deadline) - new Date(a.deadline);
            if (a.deadline < today) return -1;
            if (b.deadline < today) return 1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
    };

    const myAssignment = sortData(submittedData.filter(item => item.manager === currentUser));
    const allAssignment = sortData(submittedData);

    const getItemClass = (deadline) => {
        const today = new Date().toISOString().split('T')[0];
        return deadline < today ? 'look-item past-deadline' : 'look-item';
    };

    {myAssignment.map(item => (
        <div 
            key={item.id} 
            className={getItemClass(item.deadline)}
        >
            <p>{item.title}</p>
            <p>{item.status}</p>
        </div>
    ))}

    return (
        <div className="Assignment">
            <header className="Assignment-header">
                <div className="my-page-logout">
                <IoPerson size={24} />
                <a href="/mypage">마이페이지</a> | <a href="/logout">로그아웃</a>
                </div>
            </header>
            <button className="sidebar-toggle" onClick={toggleSidebar}>
                <IoMenu size={24} />
            </button>
            <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-content">
                    <p>aa</p>
                </div>
            </aside>
            <main>
                <div className="center-content">
                    <form className="As-create-form" onSubmit={handleSubmit}>
                        <div className="setting-list">
                            <select
                            name='manager'
                            value={formData.manager}
                            onChange={handleChange}
                            >
                                <option value="">담당자</option>
                                {managers.map((manager)=> (
                                    <option key={manager.id} value={manager.name}>
                                        {manager.name}
                                    </option>
                                ))}
                            </select>
                            <select 
                            name='type'
                            value={formData.type}
                            onChange={handleChange}
                            >
                                <option value="">과제분류</option>
                                <option vlaue="발표">발표</option>
                                <option vlaue="자료조사">자료조사</option>
                                {/*이부분도 분류 대강 짠 다음에 추가해야함*/}
                            </select>
                            <select 
                            name='diff'
                            value={formData.diff}
                            onChange={handleChange}
                            >
                                <option value="미정">과제 복잡도</option>
                                <option value="간단함">간단함</option>
                                <option value="복잡함">복잡함</option>    
                            </select>
                            <input 
                            type='date'
                            name='deadline'
                            value={formData.deadline}
                            onChange={handleChange}
                            />
                        </div>
                        <div className="container">
                            <div className="As-title">
                                <textarea
                                type="text"
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
                        <button type="submit">생성</button>
                    </form>
                    <div className="Assignment-look">
                        <div className="my-assignment">
                            <h3>내 과제 보기</h3>
                            {myAssignment.map(item => (
                                <div 
                                key={item.id} 
                                className={getItemClass(item.deadline)}  // 동적으로 클래스 적용
                                >
                                    <p>{item.title}</p>
                                    <p>{item.status}</p>
                                </div>
                            ))}
                        </div>
                        <div className="all-assignment">
                            <h3>전체 과제 보기</h3>
                            {allAssignment.map(item => (
                                <div
                                key={item.id}
                                className={getItemClass(item.deadline)}
                                >
                                <p>{item.title}</p>
                                <p>{item.manager}</p>
                                <p>{item.status}</p>
                            </div>
                            ))}
                        </div>
                    </div>
                    <NotificationPopup notifications={notifications} />
                </div>    
            </main>

        </div>
        
    )
}

export default Assignment;