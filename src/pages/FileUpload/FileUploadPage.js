import './FileUploadPage.css';
import React, { useEffect, useState } from 'react';
import { IoMenu, IoAddCircle} from "react-icons/io5";
import { useLocation, useNavigate } from 'react-router-dom';

function FileUploadPage() {
    const [files, setFiles] = useState([]);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const [selectedFilter, setSelectedFilter] = useState(null);

    const id = queryParams.get('id'); 
    const projId = queryParams.get('projId'); 

    const [formData, setFormData] = useState({
        docs:JSON.stringify({
          id : '20241121', //id || '',
          projId : 'cse00001', //projId || '',
          title : '',
          detail : '',
          category : '1',
          url: '1',
        }),
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

    const fetchFiles = async ({ projId, userId, taskId }) => {
      let baseUrl = 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/file/view';
      let queryParams = [];
  
      if (projId) queryParams.push(`projId=${projId}`);
      if (id) queryParams.push(`userId=${userId}`);
      if (taskId) queryParams.push(`taskId=${taskId}`);
  
      const url = `${baseUrl}?${queryParams.join('&')}`;
      console.log('요청 URL:', url);
  
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP 상태 오류: ${response.status}`);
  
        const data = await response.json();
  
        if (!data || data.length === 0) {
          setStatusMessage('파일이 없습니다.');
          setFiles([]);
        } else {
          setStatusMessage('');
          setFiles(data);
        }
      } catch (error) {
        setStatusMessage(`error: ${error.message}`);
        setFiles([]);
      }
    };
  
    useEffect(() => {
      if (projId) fetchFiles({ projId });
    }, [projId]);


    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        docs: {
          ...prev.docs,
          [name]: value || '',
        },
      }));
    };
  
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      setFiles([file]);
      setFormData({
        ...formData,
        file: file,
      });
    };
  
    const handleDelete = () => {
      setFiles([]);
      setFormData({
        ...formData,
        file: '',
      });
    };
  
    const handleTaskClick = (index) => {
      setSelectedTaskIndex(index);
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log("업로드 버튼이 클릭되었습니다");
  
      try {
        const projectExists = await checkIfProjectExists(formData.docs.projId);
        const response = await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/project/docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            docs: JSON.stringify(formData.docs),
          }),
        });
  
        const result = await response.json();
        if (response.ok) {
          setStatusMessage('폼이 성공적으로 제출되었습니다!');
          return 1;
        } else if (!projectExists) {
          return -2;
        } else {
          setStatusMessage('서버 오류가 발생했습니다.');
          return -3;
        }
      } catch (error) {
        console.error('폼 제출 중 오류 발생:', error);
        setStatusMessage('오류가 발생했습니다.');
      }
    };
  
    const checkIfProjectExists = async (projectId) => {
      return projectId === '123';
    };
  
    const formatDate = (dateArr) => {
      if (!Array.isArray(dateArr)) return '';
      const [y, m, d] = dateArr;
      return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
    };
  
    const handleFileClick = (file) => {
      if (file.taskName) {
        // 추후 실제 task 상세 URL로 대체
        navigate('/AssignmentDetail');
      } else {
        navigate(`/file/detail/${file.fileId}`);
      }
    };

    const handleFilterClick = (filterKey, fetchParams) => {
      setSelectedFilter(filterKey);
      fetchFiles(fetchParams);
    }


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
                {files.length > 0 && (
                    <li>
                        {files[0].name} <button onClick={handleDelete}>삭제</button>
                    </li>
                )}
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
          <div className="filter">
            <span
              className={selectedFilter === 'proj' ? 'filter-item selected' : 'filter-item'}
              onClick={() => handleFilterClick('proj', { projId })}
            >
              전체
            </span>
            <span
              className={selectedFilter === 'my' ? 'filter-item selected' : 'filter-item'}
              onClick={() => handleFilterClick('my', { userId: id })}
            >
              내 전체 파일
            </span>
            <span
              className={selectedFilter === 'myproj' ? 'filter-item selected' : 'filter-item'}
              onClick={() => handleFilterClick('myproj', { projId, userId: id })}
            >
              내 프로젝트 파일
            </span>
            <span
              className={selectedFilter === 'task' ? 'filter-item selected' : 'filter-item'}
              onClick={() => handleFilterClick('task', { taskId: 4 })}
            >
              연관 과제 파일
            </span>
          </div>
          {statusMessage && <p style={{ color: 'red' }}>{statusMessage}</p>}
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
              {files.map((file) => (
                <tr key={file} onClick={() => handleFileClick(file)} style={{ cursor: 'pointer' }}>
                  <td>{file.userName}</td>
                  <td>{file.title || file.filename}</td>
                  <td>{file.taskName || `과제 ${file.category}`}</td>
                  <td>{formatDate(file.uploadDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
export default FileUploadPage;