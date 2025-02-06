import './FileUploadPage.css';
import React, { useState } from 'react';
import { IoMenu, IoAddCircle} from "react-icons/io5";

function FileUploadPage() {
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [isUploaded, setIsUploaded] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = () => {
        if (file) {
            // Logic to handle file upload, e.g., sending to server
            setIsUploaded(true);
        }
    };

    const handleDelete = () => {
        setFile(null);
        setIsUploaded(false);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="file-upload-page">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
                <IoMenu size={24} />
            </button>
            <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-content">
                    <p>메뉴</p>
                </div>
            </aside>
            <main>
                <div className="upload-section">
                    {isUploaded ? (
                        <div className="upload-success">
                            <h2>파일이 업로드되었습니다!</h2>
                            <div>
                                <p>파일 이름: {file.name}</p>
                                <button onClick={handleDelete}>삭제</button>
                            </div>
                        </div>
                    ) : (
                        <div className="upload-form">
                            <h2>자료 업로드</h2>
                            <input type="file" onChange={handleFileChange} />
                            {file && (
                                <div>
                                    <span>선택된 파일: {file.name}</span>
                                </div>
                            )}
                            <textarea
                                placeholder="파일 설명을 입력하세요"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                            <div className="button-row">
                                <button onClick={handleUpload} disabled={!file}>
                                    업로드
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default FileUploadPage;