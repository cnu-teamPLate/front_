import './AssignmentDetail.css';
import React, { useState } from 'react';
import { IoMenu, IoAddCircle, IoBookmark } from "react-icons/io5";

//과제 상세 내용 띄워주는 코드 작성해야함. 이전 페이지에서 불러온 걸 다음 페이지로 넘겨주기 vs 여기서 api 한번 더 부르기
function AssignmentDetail() {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('Initial Title');
    const [content, setContent] = useState('This is the initial content.');
    const [dropdownValues, setDropdownValues] = useState({
        role: 'Option 1',
        type: 'Option 1',
        diff: 'Option 1',
    });
    const [deadline, setDeadline] = useState('');
    const [file, setFile] = useState(null);
    const [link, setLink] = useState('https://example.com');
    const [isDeleted, setIsDeleted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

  
    const handleFileChange = (e) => {
      setFile(e.target.files[0]);
    };
  
    const handleSave = () => {
      setIsEditing(false);
    };
  
    const handleEdit = () => {
      setIsEditing(true);
    };
  
    const handleDelete = () => {
      setIsDeleted(true);
    };
  
    if (isDeleted) {
      return <div>Post has been deleted.</div>;
    };

    const handleDropdownChange = (e) => {
        const { name, value } = e.target;
        setDropdownValues((prevValues) => ({
          ...prevValues,
          [name]: value,
        }));
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    //파일도 띄워줄 수 있도록 ui 수정해야함 
    //파일의 경우, 기존의 디테일 불러오기 부분의 반환 값에 값이 추가될 예정 (파일명, 파일 url, 파일 업로드 시각)
    return (
        <div className="As-detail">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
                <IoMenu size={24} />
            </button>
            <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-content">
                    <p>aa</p>
                </div>
            </aside>
            <main>
                <div editable-post>
                    {isEditing ? (
                        <div>
                            <div className="setting">
                                <select 
                                name="role" 
                                value={dropdownValues.role} 
                                onChange={handleDropdownChange}
                                >
                                    {/* 프로젝트 쪽 api 중에 멤버 리스트 불러오는 거에서 이름만 가져오는 식으로 진행. */}
                                    <option value="role">담당자</option>
                                    <option value="Option 2">Option 2</option>
                                    <option value="Option 3">Option 3</option>
                                </select>
                                <select 
                                name="type" 
                                value={dropdownValues.type} 
                                onChange={handleDropdownChange}
                                >
                                    <option value="type">과제분류</option>
                                    <option value="Option 2">Option 2</option>
                                    <option value="Option 3">Option 3</option>
                                </select>
                                <select 
                                name="diff" 
                                value={dropdownValues.diff} 
                                onChange={handleDropdownChange}
                                >
                                    <option value="diff">과제복잡도</option>
                                    <option value="Option 2">Option 2</option>
                                    <option value="Option 3">Option 3</option>
                                </select>
                                <input 
                                type="date" 
                                value={deadline} 
                                onChange={(e) => setDeadline(e.target.value)} 
                                />
                            </div>
                            <div className="text-input">
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                />
                                <textarea 
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                />
                            </div>
                            <div>
                                <input type="file" onChange={handleFileChange} />
                                {file && (
                                <div>
                                    <span>{file.name}</span>
                                    <button onClick={() => setFile(null)}>삭제</button>
                                </div>
                                )}
                            </div>
                            <div>
                                <input 
                                type="text" 
                                value={link} 
                                onChange={(e) => setLink(e.target.value)} 
                                />
                                <button onClick={() => setLink('')}>삭제</button>
                            </div>
                            <div className="button-row">
                                <button onClick={handleSave}>저장</button>
                            </div>
                        </div>
                    ) : (
                        <div className="view">
                            
                            <div className="inform">
                                <h3>과제 상태:</h3>
                                <p>담당자: {dropdownValues.dropdown1}</p>
                                <p>과제분류: {dropdownValues.dropdown2}</p>
                                <p>과제복잡도: {dropdownValues.dropdown3}</p>
                                <p>마감기한: {deadline ? new Date(deadline).toLocaleDateString() : '미정'}</p>
                            </div>
                            <div className="substance">
                                <h2>{title}</h2>
                                <p>{content}</p>
                                
                                {file && (
                                    <div>
                                    <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer">
                                        {file.name}
                                    </a>
                                    </div>
                                )}
                                {link && (
                                    <div>
                                    <a href={link} target="_blank" rel="noopener noreferrer">
                                        {link}
                                    </a>
                                    </div>
                                )}
                                <div className="button-row">
                                    <button onClick={handleEdit}>수정</button>
                                    <button onClick={handleDelete}>삭제</button>
                                </div>
                            </div>
                            <div className="comment">
                                <p>댓글 입력</p>
                            </div>
                        </div>
                        )}
                </div>
                

            </main>
        </div>
        
    );
            
};

export default AssignmentDetail;