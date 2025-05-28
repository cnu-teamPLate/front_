import './FileUploadPage.css';
import React, { useState } from 'react';
import { IoMenu, IoAddCircle} from "react-icons/io5";

function FileUploadPage() {
    const [files, setFiles] = useState([]);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);

    const dummyTasks = [
        { type: '발표', title: '과제 A 제목' },
        { type: 'PPT', title: '과제 B 제목' },
        { type: '발표', title: '과제 C 제목' },
        { type: 'PPT', title: '과제 D 제목' },
        { type: '발표', title: '과제 E 제목' },
        { type: 'PPT', title: '과제 F 제목' },
        { type: '발표', title: '과제 G 제목' },
        { type: 'PPT', title: '과제 H 제목' },
    ];
  
    const handleFileChange = (e) => {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    };
  
    const handleDelete = (index) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleTaskClick = (index) => {
        setSelectedTaskIndex(index);
    };
  
    return (
      <div className="container">
        <div className="upload-section">
          <h2>자료 업로드</h2>
          <div className="task-list-title">연관 과제</div>
          <div className="task-list-scroll">
            
            {dummyTasks.map((task, index) => (
                <div
                className={`task-row ${selectedTaskIndex === index ? 'selected-task' : ''}`}
                key={index}
                onClick={() => handleTaskClick(index)}
                >
                    <span className="task-type">{task.type}</span>
                    <span className="task-title">{task.title}</span>
                </div>
            ))}
            </div>
          <div className="file-box">
            <label className="file-label">
              파일 선택
              <input type="file" multiple onChange={handleFileChange} />
            </label>
          </div>
          <ul className="file-list">
            {files.map((file, index) => (
              <li key={index}>
                {file.name} <button onClick={() => handleDelete(index)}>삭제</button>
              </li>
            ))}
          </ul>
          <button className="upload-button">업로드</button>
        </div>
  
        <div className="list-section">
          <h2>자료 목록</h2>
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>자료명</th>
                <th>연관 과제</th>
                <th>업로드 일자</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={i}>
                  <td>김가나</td>
                  <td>무슨무슨 자료.pdf</td>
                  <td>과제명 어쩌구</td>
                  <td>2025.01.01</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  export default FileUploadPage;