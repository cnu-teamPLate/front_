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
    const [taskList, setTaskList] = useState([]); // 나중에 []으로 바꾸기
    const [urlList, setUrlList] = useState([]);
    const [newUrl, setNewUrl] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [editedFiles, setEditedFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);


    //const id = queryParams.get('id'); 
    //const projId = queryParams.get('projId'); 
    const id = '20241121'; 
    const projId ='cse00001'; 

    const [formData, setFormData] = useState(
      {
        id : '20241121', //id || '',
        projId : 'cse00001', //projId || '',
        title : '',
        detail : '',
        category : -1,
        url: [], // 여기도 배열로 바꾸나?
        file : [],
      }
    )
    

    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/task/view?projId=${projId}&id=${id}`);
        if (!response.ok) {
          throw new Error('과제 데이터를 불러오지 못했습니다.');
          // 아니 이게 data가 정의가 안되었대 그러면 지금 ppt 이거도 뜨면 안되는 거 아녀?
        }
        const taskData = await response.json();
        setTaskList(taskData);
      } catch (error) {
        console.error('연관 과제 불러오기 오류:', error);
        setTaskList([]); // fallback
      }
    };

    const fetchFiles = async ({ projId, userId, taskId }) => {
      let baseUrl = 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/file/view';
      let queryParams = [];
  
      if (projId) queryParams.push(`projId=${projId}`);
      if (userId) queryParams.push(`userId=${userId}`);
      if (taskId) queryParams.push(`taskId=${taskId}`);
  
      const url = `${baseUrl}?${queryParams.join('&')}`;
      console.log('요청 URL:', url);
  
      try {
        const response = await fetch(url);
  
        const fileData = await response.json();

        if (response.ok) {
          console.log('파일을 가져옴');
          setFiles(fileData);
        } else if (response.status === 400)
        {
          setStatusMessage('필수 요청 값이 존재하지 않습니다');
          setFiles([]);
        } else if(response.status === 404){
          setStatusMessage('존재하는 프로젝트 혹은 유저 혹은 과제 아이디가 아닙니다.');
          setFiles([]);
        }
      } catch (error) {
        setStatusMessage(`error: ${error.message}`);
        setFiles([]);
      }
    };
  
    useEffect(() => {
      if (projId && id) {
        fetchFiles({ projId });
        fetchTasks(); // 연관 과제 가져오기 추가
      }
    }, [projId]);


    const handleUploadInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
          [name]: value,
      }));
    };
  
    const handleFileChange = (e) => {
      const selectedFiles = Array.from(e.target.files); 
      setFiles(selectedFiles); 
      setFormData({
        ...formData,
        file: selectedFiles, 
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
      const isSameTask = selectedTaskIndex === index;
      const newSelectedIndex = isSameTask ? -1 : index;
      console.log("선택된 인덱스:", newSelectedIndex);
      setSelectedTaskIndex(newSelectedIndex);
      const newCategory = isSameTask ? "-1" : String(taskList[index].taskId);
    
      setFormData((prev) => ({
        ...prev,
          category: newCategory,
      }));
    }; // 만약 선택된 게 없다면 -1 값으로 보내줘야함
    // 선택 해제도 가능하게 코드 추가
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log("업로드 버튼이 클릭되었습니다");
  
      try {
        const formDataToSend = new FormData();
        console.log(formDataToSend);
        const {
          id, projId, title, detail, category, url, file
        } = formData;
    
        const uploadData = { id, projId, title, detail, category, url };

        formDataToSend.append('docs', new Blob(
          [JSON.stringify(formData.docs)],
          { type: 'application/json' }
        ));

        if (formData.file && formData.file.length > 0) {
          formData.file.forEach((file) => {
            formDataToSend.append('file', file);
          });
        }

        const response = await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/file/upload', {
          method: 'POST',
          body: formDataToSend,
        });

        //이거 api 주소는 스웨거 문서 확인해서 수정해두기
        //백으로 보내는 형식도 스웨거 참고
        const data = await response.json().catch(() => ({})); // JSON 파싱 실패 대비

        if (response.ok) {
          setStatusMessage(data.message || '업로드 완료되었습니다!');
        } else if (response.status === 400) {
          setStatusMessage(data.message || '요청 오류: 파일 이름을 확인해주세요.');
        } else if (response.status === 404) {
          setStatusMessage(data.message || '요청 오류: 프로젝트 ID가 존재하지 않습니다.');
        } else if (response.status === 500) {
          setStatusMessage(data.message || '서버 오류: 예상치 못한 문제가 발생했습니다.');
        } else {
          setStatusMessage('알 수 없는 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('네트워크 오류:', error);
        setStatusMessage('네트워크 오류가 발생했습니다.');
      }
    };
  
    const formatDate = (dateArr) => {
      if (!Array.isArray(dateArr)) return '';
      const [y, m, d] = dateArr;
      return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
    };
  
    //전체 삭제 버튼 따로, 파일마다 삭제, 수정 버튼 따로
    //삭제 api와 수정 api는 각 버튼 눌렀을 때 실행 
    const handleEditToggle = () => {
      setEditMode(!editMode);
      setDeleteMode(false);
    };
  
    const handleDeleteToggle = () => {
      setDeleteMode(!deleteMode);
      setEditMode(false);
      setSelectedFiles([]);
    };
  
    const handleInputChange = (index, field, value) => {
      const updated = [...editedFiles];
      updated[index][field] = value;
      setEditedFiles(updated);
    };
  
    const handleFileSelect = (fileId) => {
      setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    };
    // 전체 필터를 선택했는데 왜 업로드 폼에 파일이 생길까
  
    const handleSaveEdits = async () => {
      for (let file of editedFiles) {
        const data = new FormData();
        data.append("id", file.fileId);
        data.append("title", file.title);
        data.append("detail", file.detail);
        data.append("category", file.category);
        data.append("urls", JSON.stringify(file.urls || []));
        await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/file/put', {
          method: 'PUT',
          body: data
        });
      }
      setEditMode(false);
    };
  
    const handleDeleteFiles = async () => {
      await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/file/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: selectedFiles })
      });
      setDeleteMode(false);
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
              
              {taskList.map((task, index) => (
                <div
                  key={task.taskId}
                  className={`task-row ${selectedTaskIndex === index ? 'selected' : ''}`}
                  onClick={() => handleTaskClick(index)}
                >
                  <span className="task-type">{task.cate}</span>
                  <span className="task-title">{task.detail}</span>
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
            <div className="url-input-wrapper">
              <input className='url-input'
                type="text"
                placeholder="외부 URL을 입력하세요"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button className='plus' type="button" onClick={() => {
                if (newUrl.trim()) {
                  const updatedUrls = [...urlList, newUrl.trim()];
                  setUrlList(updatedUrls);
                  setNewUrl('');
                  setFormData((prev) => ({
                    ...prev,
                      url: updatedUrls, // formData에도 반영
                  }));
                }
              }}>추가</button>
            </div>

            <ul className="url-list">
              {urlList.map((url, index) => (
                <li key={index}>
                  {url}
                  <button type="button" onClick={() => {
                    const updated = urlList.filter((_, i) => i !== index);
                    setUrlList(updated);
                    setFormData((prev) => ({
                      ...prev,
                        url: updated,
                    }));
                  }}>삭제</button>
                </li>
              ))}
            </ul>

            <div className='description'>
                <input className='title' type='text' placeholder='제목을 입력해주세요' name='title' value={formData.title} onChange={handleUploadInputChange}/>
                <textarea className='detail' type='text' placeholder='설명을 입력해주세요' name='detail' value={formData.detail} onChange={handleUploadInputChange}/>
            </div>
            <button type='submit' className="upload-button">업로드</button>
          </form>
          
        </div>
  
        <div className="list-section">
          <h2>자료 목록</h2>
          <div className='button-group'>
            <button className='button-mode' onClick={handleEditToggle}>수정</button>
            <button className='button-mode'onClick={handleDeleteToggle}>삭제</button>
            {editMode && <button className='button-mode' onClick={handleSaveEdits}>완료</button>}
            {deleteMode && <button className='button-mode' onClick={handleDeleteFiles}>완료</button>}
          </div>
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
              연관 과제 파일 {/* 어떤 과제인지를 선택하는 창 먼저 -> taskId 넣어서 해당 과제 파일 불러오는 api 실행 -> 하단에 해당 파일 리스트 띄워주는 방식*/}
            </span>
          </div>
          {statusMessage && <p style={{ color: 'red' }}>{statusMessage}</p>}
          <table>
            <thead>
              <tr>
                <th>파일</th>
                {deleteMode && <th>선택</th>}
              </tr>
            </thead>
            <tbody>
              {editedFiles.map((file, index) => (
                <tr key={file.fileId}>
                  <td>
                    {editMode ? (
                      <input value={file.title} onChange={(e) => handleInputChange(index, 'title', e.target.value)} />
                    ) : (
                      file.title || file.filename
                    )}
                  </td>
                  <td>{file.taskName || `과제 ${file.category}`}</td>
                  <td>{formatDate(file.uploadDate)}</td>
                  {deleteMode && (
                    <td><input type="checkbox" checked={selectedFiles.includes(file.fileId)} onChange={() => handleFileSelect(file.fileId)} /></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
export default FileUploadPage;