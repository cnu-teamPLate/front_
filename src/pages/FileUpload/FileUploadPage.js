import './FileUploadPage.css';
import React, { useState } from 'react';
import { IoMenu, IoAddCircle} from "react-icons/io5";

function FileUploadPage() {
    const [files, setFiles] = useState([]);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [formData, setFormData] = useState({
        docs:{
          id : '20241121',
          projId : 'cse00001',
          title : '',
          detail : '',
          category : '1',
          url: '1',
        },
        file : '',
    })

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

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({
          ...formData,
          docs: {
              ...formData.docs,
              [name]: value || '', // undefined 방지
          },
      });
  };
  
    const handleFileChange = (e) => {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => {
          const updatedFiles = [...prev, ...newFiles];
          setFormData({
              ...formData,
              file: updatedFiles, // 파일 데이터를 formData에 추가합니다.
          });
          return updatedFiles;
      });
  };
  
  const handleDelete = (index) => {
    setFiles(prev => {
        const updatedFiles = prev.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            file: updatedFiles, // 삭제 후 파일 상태를 업데이트합니다.
        });
        return updatedFiles;
    });
};

    const handleTaskClick = (index) => {
        setSelectedTaskIndex(index);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log("업로드 버튼이 클릭되었습니다"); 
  
      try {
        const projectExists = await checkIfProjectExists(formData.projectId);
        const response = await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/project/docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        console.log('서버 응답:', response);
  
        const result = await response.json();
        if (response.ok) {
          setStatusMessage('폼이 성공적으로 제출되었습니다!');
          return 1;
        } else if(!projectExists) {
          return -2;
        }  else {
          setStatusMessage('서버 오류가 발생했습니다.');
          return -3; 
        }
      } catch (error) {
        console.error('폼 제출 중 오류 발생:', error);
        setStatusMessage('오류가 발생했습니다.');
      }
    };

    const checkIfProjectExists = async (projectId) => {
      // 실제로는 서버에 요청을 보내야 하지만, 여기서는 예시로 false를 반환
      // 예: fetch(`/check-project/${projectId}`)
      return projectId === '123';  // 예시로 ID가 '123'인 프로젝트만 존재한다고 가정
    };
  
    return (
      <div className="container">
        <div className="upload-section">
          <h2>자료 업로드</h2>
          <form onSubmit={handleSubmit}>
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
            <div className='description'>
                <input type='text' placeholder='제목을 입력해주세요' name='title' value={formData.docs.title} onChange={handleInputChange}/>
                <input type='text' placeholder='설명을 입력해주세요' name='detail' value={formData.docs.detail} onChange={handleInputChange}/>
            </div>
            <button type='submit' className="upload-button">업로드</button>
          </form>
          
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