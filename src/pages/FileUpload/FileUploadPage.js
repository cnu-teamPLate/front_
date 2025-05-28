import './FileUploadPage.css';
import React, { useEffect, useState } from 'react';
import { IoMenu, IoAddCircle} from "react-icons/io5";
import { useLocation, useNavigate } from 'react-router-dom';

const dummyAssignments = [
  {
    taskId: 1,
    id: "20241099",
    projId: "CSE00001",
    name: "김지홍",
    cate: "발표",
    level: 1,
    date: "1739620235.000000000",
    detail: "이러쿵",
    checkBox: 1,
  },
  {
    taskId: 2,
    id: "00000000",
    projId: "CSE00001",
    name: "김서강",
    cate: "PPT",
    level: 2,
    date: "1739620236.000000000",
    detail: "어쩌구",
    checkBox: 0,
  },
  {
    taskId: 3,
    id: "20241099",
    projId: "CSE00001",
    name: "홍길동",
    cate: "PPT",
    level: 2,
    date: "1739620234.000000000",
    detail: "Spring Boot API 개발",
    checkBox: 0,
  },
];


function FileUploadPage() {
    const [files, setFiles] = useState([]);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [taskList, setTaskList] = useState(dummyAssignments); // 나중에 []으로 바꾸기
    const [urlList, setUrlList] = useState([]);
    const [newUrl, setNewUrl] = useState('');


    const id = queryParams.get('id'); 
    const projId = queryParams.get('projId'); 

    const [formData, setFormData] = useState({
        docs:JSON.stringify({
          id : '20241121', //id || '',
          projId : 'cse00001', //projId || '',
          title : '',
          detail : '',
          category : '-1',
          url: '1', // 여기도 배열로 바꾸나?
        }),
        file : '',
    })


    

    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/task/view?projId=${projId}&id=${id}`);
        if (!response.ok) {
          throw new Error('과제 데이터를 불러오지 못했습니다.');
        }
        const data = await response.json();
        setTaskList(data);
      } catch (error) {
        console.error('연관 과제 불러오기 오류:', error);
        setTaskList([]); // fallback
      }
    };

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
      if (projId && id) {
        fetchFiles({ projId });
        fetchTasks(); // 연관 과제 가져오기 추가
      }
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
      setSelectedTaskIndex(index);
      
      const selectedTask = taskList[index];
      //지금 인덱스로 되고 있는데, 인덱스가 아니라 id를 건네야함
    
      setFormData((prev) => ({
        ...prev,
        docs: {
          ...prev.docs,
          category: isSameTask ? "-1" : String(taskList[index].taskId),
        },
      }));
    }; // 만약 선택된 게 없다면 -1 값으로 보내줘야함
    // 선택 해제도 가능하게 코드 추가
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log("업로드 버튼이 클릭되었습니다");
  
      try {
        const formDataToSend = new FormData();
        formDataToSend.append('docs', new Blob(
          [JSON.stringify(formData.docs)],
          { type: 'application/json' }
        ));

        if (formData.file && formData.file.length > 0) {
          formData.file.forEach((file) => {
            formDataToSend.append('file', file);
          });
        }

        const response = await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/project/docs', {
          method: 'POST',
          body: formDataToSend,
        });
        //이거 api 주소는 스웨거 문서 확인해서 수정해두기
        //백으로 보내는 형식도 스웨거 참고
  
        if (response.ok) {
          setStatusMessage('폼이 성공적으로 제출되었습니다!');
          return 1;
        } else {
          setStatusMessage('서버 오류가 발생했습니다.');
          return -3;
        }
      } catch (error) {
        console.error('폼 제출 중 오류 발생:', error);
        setStatusMessage('오류가 발생했습니다.');
      }
    };
  
    const formatDate = (dateArr) => {
      if (!Array.isArray(dateArr)) return '';
      const [y, m, d] = dateArr;
      return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
    };
  
    //전체 삭제 버튼 따로, 파일마다 삭제, 수정 버튼 따로
    //삭제 api와 수정 api는 각 버튼 눌렀을 때 실행 
    const handleFileClick = (file) => {
      if (file.taskName) {
        // 추후 실제 task 상세 URL로 대체
        navigate('/AssignmentDetail');
      } else {
        //이 부분은 filrUploadDetail에서 사용되어야할 것 같은데
        fetch(`http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/file/put`, {
          method: "PUT",
          headers: {
            "Content-Type" : "application/json"
          },
          body: JSON.stringify({
            //여기 들어가려면 수정 형식도 만들어야할 거같은데
          })
        })
          .then(response => {
            if(!response.ok) {
              throw new Error("PUT 요청 실패")
            } // 에러 사유가 꽤 많음
            return response.json();
          })
          .then(result => {
            console.log("수정 완료:", result);
          })
          .catch(error => {
            console.error("error:", error);
          })
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
                    docs: {
                      ...prev.docs,
                      url: updatedUrls, // formData에도 반영
                    },
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
                      docs: {
                        ...prev.docs,
                        url: updated,
                      },
                    }));
                  }}>삭제</button>
                </li>
              ))}
            </ul>

            <div className='description'>
                <input className='title' type='text' placeholder='제목을 입력해주세요' name='title' value={formData.docs.title} onChange={handleInputChange}/>
                <textarea className='detail' type='text' placeholder='설명을 입력해주세요' name='detail' value={formData.docs.detail} onChange={handleInputChange}/>
            </div>
            <button type='submit' className="upload-button">업로드</button>
          </form>
          
        </div>
  
        <div className="list-section">
          <h2>자료 목록</h2>
          {/*여기 언저리에 수정, 삭제 버튼 넣기 */}
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
                <th>자료명</th>
                <th>연관 과제</th>
                {/* 연관 과제 클릭하면 그쪽 페이지로 넘어가는 코드 추가 (지금은 세부 페이지로 넘어가게 되어있음) */}
                {/*파일 url 이 있어야함 그래야 파일 확인 가능
                이거 목록을 하나하나 카드형식으로 뜨게끔 아예 div로 묶어버리고, 목록상단은 그냥 파일 리스트로 바꿔야함 */}
                <th>업로드 일자</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file} onClick={() => handleFileClick(file)} style={{ cursor: 'pointer' }}>
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