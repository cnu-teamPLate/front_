import './FileUploadPage.css';
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'; // 파일 상단에 추가

const API_BASE_URL = 'https://www.teamplate-api.site';

function FileUploadPage() {
  const [files, setFiles] = useState([]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

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
  const currentUserId = urlParams.get("userId");
  const currentProjId = urlParams.get("projectId");

  const [formData, setFormData] = useState({
    id: currentUserId, // cURL에서는 20211079 사용, 여기서는 currentUserId로 통일
    projId: currentProjId,
    title: '',
    detail: '',
    category: -1,
    url: [],      // URL 문자열 배열
    file: [],     // File 객체 배열
  });



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
    console.log('파일 목록 요청 URL:', url);
    setStatusMessage('파일 목록 로딩 중...');
    try {
      const response = await fetch(url);
      const responseData = await response.json().catch(() => null);
      if (response.ok) {
        const sorted = (responseData || []).sort((a, b) => {
          const dateA = new Date(a.uploadDate || a.date);
          const dateB = new Date(b.uploadDate || b.date);
          return dateB - dateA; // 최신순 정렬 (내림차순)
        });
        setFiles(responseData || []);
        setStatusMessage(responseData && responseData.length > 0 ? '' : '표시할 파일이 없습니다.');
      } else {
        const errorMsg = responseData?.message || `오류 발생: ${response.status}`;
        setStatusMessage(errorMsg); setFiles([]); console.error('파일 목록 가져오기 실패:', errorMsg);
      }
    } catch (error) {
      console.error('파일 목록 fetch 오류:', error);
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
      files.map(file => ({
        ...file,
        title: file.title || file.origFilename || file.filename || '', // origFilename 추가
        detail: file.detail || '',
        category: file.category !== undefined ? file.category : -1,
        urls: Array.isArray(file.url) ? file.url : (file.url ? [file.url] : []),
      }))
    );
  }, [files]);

  const handleUploadInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedUploadFiles = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, file: selectedUploadFiles }));
  };

  const handleDeleteFromUploadForm = () => {
    setFormData(prev => ({ ...prev, file: [] }));
    if (document.querySelector('input[type="file"]')) { // 파일 입력 필드 초기화
      document.querySelector('input[type="file"]').value = null;
    }
  };

  const handleTaskClick = (index) => {
    const isSameTask = selectedTaskIndex === index;
    const newSelectedIndex = isSameTask ? null : index;
    setSelectedTaskIndex(newSelectedIndex);
    const newCategoryValue = newSelectedIndex === null ? -1 : taskList[newSelectedIndex].taskId;
    setFormData((prev) => ({ ...prev, category: newCategoryValue }));
  };

  // !!! handleSubmit 함수 수정 !!!
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("업로드 버튼 클릭됨. 현재 formData:", formData);
    setStatusMessage('업로드 중...');

    const formDataToSend = new FormData();

    // 1. 메타데이터를 개별 필드로 FormData에 추가
    formDataToSend.append('id', formData.id);
    formDataToSend.append('projId', formData.projId);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('detail', formData.detail);
    formDataToSend.append('category', String(formData.category)); // cURL은 문자열 "-1"을 보냄

    // URL 처리: cURL은 'url=string'을 보냈습니다.
    // 실제로는 URL 배열 중 첫 번째 것을 보내거나, 백엔드가 여러 'url' 필드를 지원해야 합니다.
    // 여기서는 cURL 예시에 맞춰, 첫 번째 URL만 보내거나, URL이 없으면 빈 문자열을 보냅니다.
    if (formData.url && formData.url.length > 0) {
      formDataToSend.append('url', formData.url[0]); // 첫 번째 URL
    } else {
      formDataToSend.append('url', ''); // cURL의 'url=string'을 대체 (빈 문자열 또는 'string' 리터럴은 백엔드와 협의)
      // 만약 'string' 리터럴을 보내야 한다면: formDataToSend.append('url', 'string');
    }
    console.log("첨부할 메타데이터:", {
      id: formData.id, projId: formData.projId, title: formData.title,
      detail: formData.detail, category: String(formData.category),
      url: (formData.url && formData.url.length > 0) ? formData.url[0] : ''
    });


    // 2. 파일 데이터 추가 (키 이름을 'files' (복수형)으로 변경)
    if (formData.file && formData.file.length > 0) {
      formData.file.forEach((fileObject) => {
        formDataToSend.append('files', fileObject, fileObject.name); // 키를 'files'로 변경
        console.log("첨부할 파일:", fileObject.name);
      });
    } else {
      console.log("업로드할 파일이 선택되지 않았습니다.");
      // cURL 요청에는 파일이 포함되어 있었으므로, 파일이 필수일 수 있습니다.
      // 파일이 없다면 에러 처리 또는 빈 파일을 보내는 로직이 필요할 수 있습니다.
      // (현재는 파일이 없으면 'files' 파트가 아예 추가되지 않음)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/file/upload`, {
        method: 'POST',
        body: formDataToSend,
        // headers: { 'accept': 'application/json; charset=utf8' } // cURL에 있었으나, fetch에서는 보통 자동처리
      });

      const responseData = await response.json().catch(() => {
        return response.text().then(text => ({ message: text || `서버 응답 파싱 실패 (상태: ${response.status})` }));
      });

      if (response.ok) {
        setStatusMessage(responseData.message || '업로드 완료되었습니다!');
        setFormData(prev => ({
          ...prev, title: '', detail: '', category: -1, url: [], file: []
        }));
        setUrlList([]); setSelectedTaskIndex(null);
        if (document.querySelector('input[type="file"]')) {
          document.querySelector('input[type="file"]').value = null;
        }
        fetchFiles({ projId: currentProjId, userId: currentUserId, isDefaultLoad: true });
      } else {
        setStatusMessage(responseData.message || `오류 발생: ${response.status}`);
        console.error("업로드 실패 응답:", responseData);
      }
    } catch (error) {
      console.error('업로드 중 네트워크 또는 기타 오류:', error);
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
  const handleFileSelectForDeletion = (fileId) => {
    setSelectedFilesToDelete(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
  };

  const handleSaveEdits = async () => {
    if (editedFiles.length === 0) { setStatusMessage("수정할 파일이 없습니다."); return; }
    setStatusMessage("수정 사항 저장 중..."); let allSuccess = true; setMode('default');
    for (const fileToEdit of editedFiles) {
      const urlsToSend = Array.isArray(fileToEdit.urls) ? fileToEdit.urls : [];
      const payload = {
        id: fileToEdit.fileId, title: fileToEdit.title, detail: fileToEdit.detail,
        category: fileToEdit.category === -1 || fileToEdit.category === null ? null : parseInt(fileToEdit.category, 10),
        urls: urlsToSend,
      };
      try {
        const response = await fetch(`${API_BASE_URL}/file/put`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!response.ok) { allSuccess = false; const errorData = await response.json().catch(() => null); console.error(`파일 ID ${fileToEdit.fileId} 수정 실패:`, errorData?.message || response.status); }
      } catch (error) { allSuccess = false; console.error(`파일 ID ${fileToEdit.fileId} 수정 중 네트워크 오류:`, error); }
    }
    setMode('default');
    console.log('000');
    setStatusMessage(allSuccess ? "모든 수정 사항이 저장되었습니다." : "일부 파일 수정에 실패했습니다. 콘솔을 확인해주세요.");
    fetchFiles({ projId: currentProjId, userId: currentUserId, isDefaultLoad: true });
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
      } else { setStatusMessage(responseData?.message || `파일 삭제 실패: ${response.status}`); }
    } catch (error) { console.error('파일 삭제 중 네트워크 오류:', error); setStatusMessage(`파일 삭제 오류: ${error.message}`); }
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
    // JSX 부분은 이전과 거의 동일하게 유지됩니다.
    // 주요 변경점은 handleSubmit 함수와 같이 로직 부분에 있습니다.
    // 하단 JSX에서 파일 업로드 폼의 파일 목록 표시 부분 수정.
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
              )) : <p className="no-tasks">연관된 과제가 없습니다.</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="file-label main-file-label">
              파일 선택 (다중 선택 가능)
              <input type="file" multiple onChange={handleFileChange} />
            </label>
          </div>

          {/* 업로드할 파일 미리보기 목록 */}
          {filesForUploadUI.length > 0 && (
            <div className="selected-files-preview">
              <h4>선택된 파일 (업로드 예정):</h4>
              <ul className="file-list">
                {filesForUploadUI.map((file, index) => (
                  <li key={index}>
                    {file.name} ({file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(file.size / 1024)} KB`})
                  </li>
                ))}
              </ul>
              <button type="button" onClick={handleDeleteFromUploadForm} className="delete-all-selected-button">선택한 파일 모두 지우기</button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="file-title">제목</label>
            <input id="file-title" className='title' type='text' placeholder='제목을 입력해주세요' name='title' value={formData.title} onChange={handleUploadInputChange} />
          </div>

          <div className="form-group">
            <label htmlFor="file-detail">설명</label>
            <textarea id="file-detail" className='detail' placeholder='설명을 입력해주세요' name='detail' value={formData.detail} onChange={handleUploadInputChange} />
          </div>

          <div className="form-group">
            <label>외부 URL (선택 사항, 여러 개 추가 가능)</label>
            <div className="url-input-wrapper">
              <input className='url-input'
                type="text"
                placeholder="예: https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <button className='plus button-add-url' type="button" onClick={() => {
                if (newUrl.trim()) {
                  const updatedUrls = [...formData.url, newUrl.trim()];
                  setFormData((prev) => ({ ...prev, url: updatedUrls }));
                  setNewUrl('');
                }
              }}>URL 추가</button>
            </div>
            {formData.url.length > 0 && (
              <ul className="url-list added-url-list">
                <h4>추가된 URL:</h4>
                {formData.url.map((urlItem, index) => (
                  <li key={index}>
                    <a href={urlItem} target="_blank" rel="noopener noreferrer">{urlItem}</a>
                    <button type="button" className="delete-url-button" onClick={() => {
                      const updated = formData.url.filter((_, i) => i !== index);
                      setFormData((prev) => ({ ...prev, url: updated }));
                    }}>삭제</button>
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
        <div className='button-group filter-edit-delete-group'>
          <div className="filter">
            <span className={selectedFilter === 'proj' ? 'filter-item selected' : 'filter-item'} onClick={() => handleFilterClick('proj')}>전체 프로젝트 파일</span>
            <span className={selectedFilter === 'myproj' ? 'filter-item selected' : 'filter-item'} onClick={() => handleFilterClick('myproj')}>내 프로젝트 파일</span>
          </div>
          <div className='edit-delete-buttons'>
            {mode === 'default' && (
              <>
                <button className="button-mode" onClick={() => setMode('edit')}>수정</button>
                <button className="button-mode" onClick={() => setMode('delete')}>삭제</button>
              </>
            )}

            {mode === 'edit' && (
              <button className="button-mode action-button" onClick={handleSaveEdits}>
                수정 완료
              </button>
            )}

            {mode === 'delete' && (
              <>
                <button className="button-mode action-button" onClick={handleDeleteSelectedFiles}>
                  선택 삭제
                </button>
                <button className="button-mode" onClick={() => setMode('default')}>
                  완료
                </button>
              </>
            )}
          </div>
        </div>

        {/* 파일 목록의 상태 메시지는 테이블 내부에 표시하거나 별도 위치에 둘 수 있음 */}
        {/* {statusMessage && !statusMessage.includes('업로드') && <p className={`status-message list-status ${statusMessage.includes('오류') || statusMessage.includes('실패') ? 'error' : 'success'}`}>{statusMessage}</p>} */}

        <div className="file-table-container">
          <table>
            <thead>
              <tr>
                {mode === 'delete' && <th className="checkbox-column">선택</th>}
                <th>{mode === 'edit' ? '제목 (수정)' : '제목'}</th>
                <th className='task-title-box'>연관 과제</th>
                <th className='date-title-box'>업로드 날짜</th>
                {mode === 'edit' && <th>설명 (수정)</th>}
                {mode === 'edit' && <th>URL (수정)</th>}
              </tr>
            </thead>
            <tbody>
              {editedFiles.length > 0 ? editedFiles.map((file, index) => (
                <tr key={file.fileId || index}>
                  {mode === 'delete' && (
                    <td className="checkbox-column">
                      <input type="checkbox" checked={selectedFilesToDelete.includes(file.fileId)} onChange={() => handleFileSelectForDeletion(file.fileId)} />
                    </td>
                  )}
                  <td className='file-cell-text'>
                    {mode != 'edit' ? (
                      <div>
                        <a
                          href={`${API_BASE_URL}/file/download/${file.fileId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-title-container"
                        >
                          {file.title || file.origFilename || file.filename || '제목 없음'}
                        </a>
                        {file.detail && (
                          <div className="file-detail-subtext">
                            {file.detail}
                          </div>
                        )}
                      </div>

                    ) : (
                      <input
                        className="edit-input"
                        type="text"
                        value={file.title}
                        onChange={(e) =>
                          handleInputChangeForListedFile(index, 'title', e.target.value)
                        }
                      />
                    )}
                  </td>
                  <td className='category-text'>
                    {file.taskName?.trim() && file.category !== -1 && file.category != null ? (
                      <Link
                        to={`/task/${file.category}`} // ← 나중에 링크 구조 바꾸셔도 됩니다
                        className="task-link"
                      >
                        {file.taskName}
                      </Link>
                    ) : (
                      '없음'
                    )}
                  </td>



                  <td className='date-text'>{formatDate(file.uploadDate || file.date)}</td>
                  {editMode && (<td> <input className="edit-input" type="text" value={file.detail} onChange={(e) => handleInputChangeForListedFile(index, 'detail', e.target.value)} /> </td>)}
                  {editMode && (<td> <input className="edit-input" type="text" value={file.urls && file.urls[0] ? file.urls[0] : ''} onChange={(e) => handleInputChangeForListedFile(index, 'urls', [e.target.value])} placeholder="URL 입력" /> </td>)}
                </tr>
              )) : (
                <tr>
                  <td colSpan={editMode ? 6 : (deleteMode ? 4 : 3)} style={{ textAlign: 'center', padding: '20px' }}>
                    {statusMessage.includes('로딩 중') ? '로딩 중...' : (statusMessage && !statusMessage.includes('업로드') ? statusMessage : '표시할 파일이 없습니다.')}
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