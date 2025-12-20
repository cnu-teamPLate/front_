

import './FileUploadPage.css';
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'https://teamplate-api.site';

function FileUploadPage() {

  const [files, setFiles] = useState([]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [selectedFilter, setSelectedFilter] = useState('proj');
  const [taskList, setTaskList] = useState([]);
  const [urlList, setUrlList] = useState([]);
  const [newUrl, setNewUrl] = useState('');

  const [mode, setMode] = useState('default');
  const [deleteMode, setDeleteMode] = useState([]);
  const [editMode, setEditMode] = useState([]);

  const [editedFiles, setEditedFiles] = useState([]);
  const [selectedFilesToDelete, setSelectedFilesToDelete] = useState([]);

  const urlParams = new URLSearchParams(location.search);
  const currentProjId = params.projId || urlParams.get("projectId");
  const currentUserId = urlParams.get("userId") || localStorage.getItem('userId');

  const [formData, setFormData] = useState({
    id: null,
    projId: null,
    title: '',
    detail: '',
    category: -1,
    url: [],
    file: [],
  });

  // ... (useEffect, fetchTasks, fetchFiles, handleSubmit 등 모든 로직 함수는 그대로 둡니다) ...
  // (코드 길이를 줄이기 위해 로직 부분은 생략하고 렌더링 부분만 보여드립니다.)
  // 기존 로직 코드는 그대로 사용하시면 됩니다.

  useEffect(() => {
    if (currentProjId || currentUserId) {
      setFormData(prev => ({
        ...prev,
        id: currentUserId || prev.id,
        projId: currentProjId || prev.projId,
      }));
    }
  }, [currentProjId, currentUserId]);


  const fetchTasks = useCallback(async () => {
    if (!currentProjId || !currentUserId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/task/view?projId=${currentProjId}&id=${currentUserId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || '연관 과제 데이터를 불러오지 못했습니다.');
      }
      const taskData = await response.json();
      setTaskList(taskData || []);
    } catch (error) {
      console.error('연관 과제 불러오기 오류:', error);
      setStatusMessage(`연관 과제 로딩 실패: ${error.message}`);
      setTaskList([]);
    }
  }, [currentProjId, currentUserId]);

  const fetchFiles = useCallback(async (filterParams) => {
    if (!filterParams) return;
    let baseUrl = `${API_BASE_URL}/file/view`;
    let queryParams = [];
    if (filterParams.projId) queryParams.push(`projId=${filterParams.projId}`);
    if (filterParams.userId) queryParams.push(`userId=${filterParams.userId}`);
    if (filterParams.taskId) queryParams.push(`taskId=${filterParams.taskId}`);
    if (queryParams.length === 0 && !filterParams.isDefaultLoad) {
      setFiles([]); return;
    }
    const url = queryParams.length > 0 ? `${baseUrl}?${queryParams.join('&')}` : baseUrl;
    setStatusMessage('파일 목록 로딩 중...');
    try {
      const response = await fetch(url);
      const responseData = await response.json().catch(() => null);
      if (response.ok) {
        const sorted = (responseData || []).sort((a, b) => {
          const dateA = new Date(a.uploadDate || a.date);
          const dateB = new Date(b.uploadDate || b.date);
          return dateB - dateA;
        });
        setFiles(responseData || []);
        setStatusMessage(responseData && responseData.length > 0 ? '' : '표시할 파일이 없습니다.');
      } else {
        const errorMsg = responseData?.message || `오류 발생: ${response.status}`;
        setStatusMessage(errorMsg); setFiles([]);
      }
    } catch (error) {
      setStatusMessage(`파일 목록 로딩 오류: ${error.message}`); setFiles([]);
    }
  }, []);

  useEffect(() => {
    if (currentProjId && currentUserId) {
      fetchFiles({ projId: currentProjId, isDefaultLoad: true });
      fetchTasks();
    }
  }, [currentProjId, currentUserId, fetchFiles, fetchTasks]);

  useEffect(() => {
    setEditedFiles(
      files.map(file => {
        let taskName = null;
        if (file.category && file.category !== -1 && file.category !== null) {
          const matchedTask = taskList.find(task => task.taskId === file.category || String(task.taskId) === String(file.category));
          if (matchedTask) {
            taskName = matchedTask.taskName || matchedTask.detail || matchedTask.title || `과제 ID: ${file.category}`;
          }
        }
        
        const fileId = file.fileId || file.id || file.docId || file.file_id;
        
        return {
          ...file,
          fileId: fileId,
          title: file.title || file.origFilename || file.filename || '',
          detail: file.detail || '',
          category: file.category !== undefined ? file.category : -1,
          taskName: taskName || file.taskName || null,
          urls: Array.isArray(file.urls) ? file.urls : (Array.isArray(file.url) ? file.url : (file.url ? [file.url] : (file.urls ? [file.urls] : []))),
        };
      })
    );
  }, [files, taskList]);

  const handleUploadInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedUploadFiles = Array.from(e.target.files);
    setFormData(prev => ({ 
      ...prev, 
      file: [...(prev.file || []), ...selectedUploadFiles] 
    }));
  };

  const handleDeleteFromUploadForm = () => {
    setFormData(prev => ({ ...prev, file: [] }));
    const fileInput = document.getElementById('file-upload-input');
    if (fileInput) {
      fileInput.value = null;
    }
  };

  const handleRemoveFileFromUploadList = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      file: prev.file.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleTaskClick = (index) => {
    const isSameTask = selectedTaskIndex === index;
    const newSelectedIndex = isSameTask ? null : index;
    setSelectedTaskIndex(newSelectedIndex);
    const newCategoryValue = newSelectedIndex === null ? -1 : taskList[newSelectedIndex].taskId;
    setFormData((prev) => ({ ...prev, category: newCategoryValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalUserId = currentUserId || localStorage.getItem('userId');
    const finalProjId = currentProjId;
    
    if (!finalUserId || !finalProjId) {
      setStatusMessage(`사용자 ID 또는 프로젝트 ID가 없습니다.`);
      return;
    }
    
    if (!formData.title || formData.title.trim() === '') {
      setStatusMessage('제목을 입력해주세요.');
      return;
    }
    
    if ((!formData.file || formData.file.length === 0) && (!formData.url || formData.url.length === 0)) {
      setStatusMessage('파일 또는 URL 중 하나는 입력해주세요.');
      return;
    }
    
    setStatusMessage('업로드 중...');

    const formDataToSend = new FormData();
    formDataToSend.append('id', finalUserId);
    formDataToSend.append('projId', finalProjId);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('detail', formData.detail);
    formDataToSend.append('category', String(formData.category));

    if (formData.url && formData.url.length > 0) {
      formDataToSend.append('url', formData.url[0]);
    } else {
      formDataToSend.append('url', '');
    }

    if (formData.file && formData.file.length > 0) {
      formData.file.forEach((fileObject) => {
        formDataToSend.append('files', fileObject, fileObject.name);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}/file/upload`, {
        method: 'POST',
        body: formDataToSend,
      });

      const responseData = await response.json().catch(() => ({ message: '서버 응답 파싱 실패' }));

      if (response.ok) {
        setStatusMessage(responseData.message || '업로드 완료되었습니다!');
        setFormData(prev => ({
          ...prev, 
          title: '', 
          detail: '', 
          category: -1, 
          url: [], 
          file: [],
          id: finalUserId,
          projId: finalProjId
        }));
        setUrlList([]); 
        setNewUrl('');
        setSelectedTaskIndex(null);
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = null;
        fetchFiles({ projId: finalProjId, userId: finalUserId, isDefaultLoad: true });
      } else {
        setStatusMessage(responseData.message || `오류 발생: ${response.status}`);
      }
    } catch (error) {
      setStatusMessage(`업로드 실패: ${error.message}`);
    }
  };

  const formatDate = (dateArr) => {
    if (!dateArr) return 'N/A';
    if (Array.isArray(dateArr) && dateArr.length >= 3) {
      const [y, m, d] = dateArr;
      return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
    } else if (typeof dateArr === 'string') {
      try { return new Date(dateArr).toLocaleDateString('ko-KR'); } catch (e) { return dateArr; }
    }
    return '날짜 형식 오류';
  };

  const handleInputChangeForListedFile = (index, field, value) => {
    const updated = [...editedFiles];
    updated[index] = { ...updated[index], [field]: value };
    setEditedFiles(updated);
  };

  const handleFileChangeForEdit = (index, e) => {
    const selectedFiles = Array.from(e.target.files);
    const updated = [...editedFiles];
    updated[index] = { ...updated[index], newFiles: selectedFiles };
    setEditedFiles(updated);
  };

  const handleFileSelectForDeletion = (fileId) => {
    setSelectedFilesToDelete(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
  };

  const handleSaveEdits = async () => {
    if (editedFiles.length === 0) { setStatusMessage("수정할 파일이 없습니다."); return; }
    
    setStatusMessage("수정 사항 저장 중...");
    let allSuccess = true;
    const errors = [];
    
    for (const fileToEdit of editedFiles) {
      let urlsToSend = [];
      if (Array.isArray(fileToEdit.urls)) {
        urlsToSend = fileToEdit.urls.filter(url => url && url.trim() !== '');
      } else if (fileToEdit.urls && typeof fileToEdit.urls === 'string' && fileToEdit.urls.trim() !== '') {
        urlsToSend = [fileToEdit.urls.trim()];
      }

      try {
          const formDataToSend = new FormData();
          formDataToSend.append('id', String(fileToEdit.fileId));
          formDataToSend.append('title', fileToEdit.title || '');
          formDataToSend.append('detail', fileToEdit.detail || '');
          formDataToSend.append('category', fileToEdit.category === -1 || fileToEdit.category === null ? '-1' : String(fileToEdit.category));
          formDataToSend.append('urls', JSON.stringify(urlsToSend));
          
          if (fileToEdit.newFiles && fileToEdit.newFiles.length > 0) {
            fileToEdit.newFiles.forEach((fileObj) => {
              formDataToSend.append('files', fileObj, fileObj.name);
          });
        }
          
          const response = await fetch(`${API_BASE_URL}/file/put`, {
            method: 'PUT',
            body: formDataToSend
          });
          
          const responseData = await response.json().catch(() => ({ message: 'Parsing Error' }));
        
        if (!response.ok) { 
          allSuccess = false;
          errors.push(`파일 수정 실패: ${responseData.message}`);
        }
      } catch (error) { 
        allSuccess = false;
        errors.push(`네트워크 오류`);
      }
    }
    
    if (allSuccess) {
      setStatusMessage("모든 수정 사항이 저장되었습니다.");
      setMode('default');
      await fetchFiles({ projId: currentProjId, userId: currentUserId, isDefaultLoad: true });
    } else {
      setStatusMessage(`일부 파일 수정에 실패했습니다.`);
    }
  };

  const handleDeleteSelectedFiles = async () => {
    if (selectedFilesToDelete.length === 0) { setStatusMessage("삭제할 파일을 선택해주세요."); return; }
    setStatusMessage("선택된 파일 삭제 중...");
    try {
      const response = await fetch(`${API_BASE_URL}/file/delete`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: selectedFilesToDelete })
      });
      const responseData = await response.json().catch(() => null);
      if (response.ok) {
        setStatusMessage(responseData?.message || "선택된 파일이 삭제되었습니다."); setSelectedFilesToDelete([]);
      } else { setStatusMessage(responseData?.message || `파일 삭제 실패`); }
    } catch (error) { setStatusMessage(`파일 삭제 오류`); }
    setMode('default');
    fetchFiles({ projId: currentProjId, userId: currentUserId, isDefaultLoad: true });
  };

  const handleFilterClick = (filterKey) => {
    setSelectedFilter(filterKey);
    let params = { isDefaultLoad: false };
    switch (filterKey) {
      case 'proj': params.projId = currentProjId; break;
      case 'my': params.userId = currentUserId; break;
      case 'myproj': params.projId = currentProjId; params.userId = currentUserId; break;
      case 'task':
        if (selectedTaskIndex !== null && taskList[selectedTaskIndex]) {
          params.taskId = taskList[selectedTaskIndex].taskId;
        } else { setStatusMessage("연관 과제를 먼저 선택해주세요."); return; }
        break;
      default: params.projId = currentProjId;
    }
    fetchFiles(params);
  };

  const filesForUploadUI = formData.file || [];

  return (
    <div className="container">
      <div className="upload-section">
        <h2>자료 업로드</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="task-list-title">연관 과제 (선택)</label>
            <div className="task-list-scroll">
              {taskList.length > 0 ? taskList.map((task, index) => (
                <div
                  key={task.taskId}
                  className={`task-row ${selectedTaskIndex === index ? 'selected' : ''}`}
                  onClick={() => handleTaskClick(index)}
                >
                  <span className="task-type">{task.cate || '기타'}</span>
                  <span className="task-title">{task.detail || task.title || `과제 ID: ${task.taskId}`}</span>
                </div>
              )) : <p style={{textAlign:'center', padding:'10px', color:'#999'}}>연관된 과제가 없습니다.</p>}
            </div>
          </div>

          <div className="form-group">
            <div className="files-group">
              <label>파일 선택 (다중 선택 가능)</label>
              <input 
                id="file-upload-input"
                type="file" 
                multiple 
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button 
                type="button"
                onClick={() => document.getElementById('file-upload-input')?.click()}
                className="file-upload-button"
              >
                + 파일 추가
              </button>
            </div>

            {filesForUploadUI.length > 0 && (
              <div className="selected-files-preview">
                <button type="button" className='all-delete' onClick={handleDeleteFromUploadForm} >전체 삭제</button>
                <ul className="file-list">
                  {filesForUploadUI.map((file, index) => (
                    <li key={index}>
                      <span>{file.name}</span>
                      <button type="button" onClick={() => handleRemoveFileFromUploadList(index)}>X</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="file-title">제목</label>
            <input id="file-title" className='title' type='text' placeholder='제목을 입력해주세요' name='title' value={formData.title} onChange={handleUploadInputChange} />
          </div>

          <div className="form-group">
            <label htmlFor="file-detail">설명</label>
            <textarea id="file-detail" className='detail' placeholder='설명을 입력해주세요' name='detail' value={formData.detail} onChange={handleUploadInputChange} />
          </div>

          <div className="form-group">
            <label>외부 URL (선택 사항)</label>
            <div className="url-input-wrapper">
              <input className='url-input'
                type="text"
                placeholder="예: https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button className='add-url' type="button" onClick={() => {
                if (newUrl.trim()) {
                  const updatedUrls = [...formData.url, newUrl.trim()];
                  setFormData((prev) => ({ ...prev, url: updatedUrls }));
                  setNewUrl('');
                }
              }}>+</button>
            </div>
            {formData.url.length > 0 && (
              <ul className="url-list added-url-list">
                {formData.url.map((urlItem, index) => (
                  <li key={index}>
                    <a href={urlItem} target="_blank" rel="noopener noreferrer">{urlItem}</a>
                    <button type="button" className="delete-url-button" onClick={() => {
                      const updated = formData.url.filter((_, i) => i !== index);
                      setFormData((prev) => ({ ...prev, url: updated }));
                    }}>X</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type='submit' className="upload-button">업로드</button>
        </form>
        {statusMessage && <p className={`status-message ${statusMessage.includes('오류') || statusMessage.includes('실패') ? 'error' : 'success'}`}>{statusMessage}</p>}
      </div>

      <div className="list-section">
        <h2>자료 목록</h2>
        <div className='filter-edit-delete-group'>
          <div className="filter">
            <span className={selectedFilter === 'proj' ? 'filter-item selected' : 'filter-item'} onClick={() => handleFilterClick('proj')}>전체 파일</span>
            <span className={selectedFilter === 'myproj' ? 'filter-item selected' : 'filter-item'} onClick={() => handleFilterClick('myproj')}>내 파일</span>
          </div>
          <div className='edit-delete-buttons'>
            {mode === 'default' && (
              <>
                <button onClick={() => setMode('edit')}>수정</button>
                <button onClick={() => setMode('delete')}>삭제</button>
              </>
            )}
            {mode === 'edit' && <button className="action-button" onClick={handleSaveEdits}>완료</button>}
            {mode === 'delete' && (
              <>
                <button className="action-button" onClick={handleDeleteSelectedFiles}>삭제하기</button>
                <button onClick={() => setMode('default')}>취소</button>
              </>
            )}
          </div>
        </div>

        <div className="file-table-container">
          <table>
            <thead>
              <tr>
                {mode === 'delete' && <th style={{width:'40px'}}>V</th>}
                <th>제목</th>
                <th style={{width:'25%'}}>연관 과제</th>
                {mode !== 'edit' && <th style={{width:'20%'}}>날짜</th>}
                {mode === 'edit' && <th>수정</th>}
              </tr>
            </thead>
            <tbody>
              {editedFiles.length > 0 ? editedFiles.map((file, index) => (
                <tr key={file.fileId || index}>
                  {mode === 'delete' && (
                    <td>
                      <input type="checkbox" checked={selectedFilesToDelete.includes(file.fileId)} onChange={() => handleFileSelectForDeletion(file.fileId)} />
                    </td>
                  )}
                  <td>
                    {mode !== 'edit' ? (
                      <div>
                        {file.url ? (
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-title-container">
                            {file.title || file.origFilename || '제목 없음'}
                          </a>
                        ) : (
                          <span className="file-title-container">{file.title || '제목 없음'}</span>
                        )}
                        {file.detail && <div style={{fontSize:'0.8rem', color:'#888', marginTop:'4px'}}>{file.detail}</div>}
                      </div>
                    ) : (
                      <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                        <input className="edit-input" type="text" value={file.title} onChange={(e) => handleInputChangeForListedFile(index, 'title', e.target.value)} />
                        <textarea className="edit-input" value={file.detail} onChange={(e) => handleInputChangeForListedFile(index, 'detail', e.target.value)} style={{minHeight:'50px'}} />
                      </div>
                    )}
                  </td>
                  <td>
                    {mode === 'edit' ? (
                      <select className="edit-input" value={file.category || ''} onChange={(e) => handleInputChangeForListedFile(index, 'category', e.target.value)}>
                        <option value="-1">없음</option>
                        {taskList.map(task => <option key={task.taskId} value={task.taskId}>{task.title || task.detail}</option>)}
                      </select>
                    ) : (
                      file.taskName ? <span className="task-link">{file.taskName}</span> : '-'
                    )}
                  </td>
                  {mode !== 'edit' && <td className='date-text'>{formatDate(file.uploadDate || file.date)}</td>}
                  {mode === 'edit' && (
                    <td>
                      <input type="file" onChange={(e) => handleFileChangeForEdit(index, e)} />
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#999'}}>
                    {statusMessage.includes('로딩') ? '로딩 중...' : '표시할 파일이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FileUploadPage;