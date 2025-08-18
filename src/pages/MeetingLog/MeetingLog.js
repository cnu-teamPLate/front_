import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams} from "react-router-dom";
import { IoMenu, IoMicSharp, IoRecordingOutline } from "react-icons/io5";
import './MeetingLog.css';

const date = new Date();

const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const hours = String(date.getHours()).padStart(2, '0');
const minutes = String(date.getMinutes()).padStart(2, '0');
const seconds = String(date.getSeconds()).padStart(2, '0');

const formattedDate = `${year}. ${month}. ${day}`;
const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

const API_BASE_URL = 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080';

function MeetingLog() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [participants, setParticipants] = useState([]);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');


  const [formData, setFormData] = useState({
        scheId: '',
        projId: '',
        contents: '',
        title: '',
        date: '',
        fix: '',
        participants: [],
  });

  const { projId } = useParams();
  console.log("projId:", projId)


  const [titlePlaceholder, setTitlePlaceholder] = useState('회의명을 적어주세요');
  const [detailPlaceholder, setDetailPlaceholder] = useState('회의 내용을 적어주세요');
  const [fixPlaceholder, setFixPlaceholder] = useState('확정된 내용을 정리해주세요');

  const [projectParticipants, setProjectParticipants] = useState([]);
  const [meetingParticipants, setMeetingParticipants] = useState([]);
  const handleSelectParticipant = (e) => {
    const selectedName = e.target.value;
    if (!meetingParticipants.includes(selectedName)) {
      const updatedList = [...meetingParticipants, selectedName];
      setMeetingParticipants(updatedList);

      setFormData((prev) => ({
        ...prev,
        projId: projId,
        participants: updatedList.map(name => {
          const matched = projectParticipants.find(p => p.name === name);
          return matched ? { name: matched.name, id: matched.id } : { name, id: '' };
        }),  date: formattedDateTime, 
      }));
    }      
  };
  const handleRemove = (nameToRemove) => {
    setMeetingParticipants(meetingParticipants.filter(name => name !== nameToRemove));
  };

  const textareaRef = useRef(null);

  const fetchFiles = useCallback(async (filterParams) => {
    if (!filterParams) return;
    let baseUrl = `${API_BASE_URL}/schedul/meeting/view/log`;
    let queryParams = [];
    if (filterParams.projId) queryParams.push(`projId=${filterParams.projId}`);
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
    const textarea = textareaRef.current;
    if (!textarea) return;

    const autoResize = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    textarea.addEventListener("input", autoResize);

    // 초기 높이 맞추기
    autoResize();

    return () => {
      textarea.removeEventListener("input", autoResize);
    };
  }, []);

  useEffect(() => {
        if (!projId) return;
        const fetchProjectMembers = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/member/project/${projId}`);
                if (!response.ok) {
                    throw new Error('프로젝트 멤버 정보를 불러올 수 없습니다.');
                }                
                else {console.log("잘됨");}
                const members = await response.json();
                setProjectParticipants(members);

            } catch (error) {
                console.error("프로젝트 멤버 로딩 오류:", error);
                setProjectParticipants([]);
            }
        };
        fetchProjectMembers();
        if (projId) {
          setFormData((prev) => ({
            ...prev,
            projId: projId,
          }));
        }
  }, [projId]);
  
  const audioRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const RecordingComponent = () => {

    //const [recordingText] = useState('');
    //const [realTimeData, setRealTimeData] = useState('');
    //const [realTimeText, setRealTimeText] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('');
    const [meetingContents, setMeetingContents] = useState('');

    const handleRecordButtonClick = async () => {
      if (!isRecording) {
        // Start Recording
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          let audioChunks = [];

          recorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          recorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            setAudioBlob(audioBlob);
          };

          recorder.start();
          setMediaRecorder(recorder);
          setIsRecording(true);
        } else {
          alert("Your browser does not support audio recording.");
        }
      } else {
        // Stop Recording
        mediaRecorder.stop();
        setIsRecording(false);
      }
    };

    const handleEndButtonClick = async () => {
      if (!audioBlob) {
        alert("No audio file recorded.");
        return;
      }

      const formData = new FormData();
      formData.append("file", audioBlob, `${meetingTitle || "meeting_log"}.wav`);

      try {
        const response = await fetch(
          'https://port-0-localhost-m1w79fyl6ab28642.sel4.cloudtype.app/api/save',
          {
            method: 'POST',
            headers: {},
            body: formData,
          }
        );

        if (response.ok) {
          navigate('/schedule');
        } else {
          const errorData = await response.text();
          console.error("Error saving recording:", errorData);
          alert("Failed to save recording. Please try again.");
        }

      } catch (error) {
        console.error("Error saving recording:", error);
        alert("Error saving recording. Please try again.");
      }
    };


    /*
        useEffect(() => {
          fetchMockParticipants();
    
          // 실시간 편집 업데이트 받기
          socket.on('update', (content) => {
            console.log('Update received from server:', content);
            setRealTimeText(content);
            
          });
    
          return () => {
            socket.off('update'); // 컴포넌트 언마운트 시 소켓 연결 해제
          };
        }, [realTimeText, socket]);
    
        const handleEditorChange = (e) => {
          const newText = e.target.value;
          setRealTimeText(newText);
          socket.emit('edit', newText); // 서버로 변경된 텍스트 전송
        };*/


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("업로드 버튼 클릭됨. 현재 formData:", formData);
    setStatusMessage('업로드 중...');

    const formDataToSend = new FormData();

    // 1. 메타데이터를 개별 필드로 FormData에 추가
    formDataToSend.append('scheId', formData.scheId);
    formDataToSend.append('projId', formData.projId);
    formDataToSend.append('contents', formData.contents);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('date', formData.date);
    formDataToSend.append('fix', formData.fix);
    formDataToSend.append('participants', JSON.stringify(formData.participants));

    console.log("첨부할 메타데이터:", {
      scheId: formData.scheId, projId: formData.projId, contents: formData.contents, title: formData.title,
      date: formData.date, fix: formData.fix, participants:formData.participants, 
      url: (formData.url && formData.url.length > 0) ? formData.url[0] : ''
    });


    try {
      const response = await fetch(`${API_BASE_URL}/schedule/meeting/upload/log`, {
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
          ...prev, contents: '', title: '', date: '', fix:'', participants:[]
        }));
      }
    } catch (error) {
      console.error('업로드 중 네트워크 또는 기타 오류:', error);
      setStatusMessage(`업로드 실패: ${error.message}`);
    }
  };



    return (
      <div className="MeetingLog">
        <h1>회의록</h1>
        <div className="controls">
          <button className="record-button" onClick={handleRecordButtonClick}>
            {isRecording ? <IoRecordingOutline size={20} /> : <IoMicSharp size={20} />}
            {isRecording ? "기록 중" : "자동기록"}
          </button>
          <p className="meetDate">{formattedDate}</p>
          <div className="participants">
            <h4 className='participants-title'>참여자</h4>
            <ul className='li-list'>
              {meetingParticipants.map((name) => (
                <li key={name}>
                  {name}
                  <button className="x" onClick={() => handleRemove(name)}>x</button>
                </li>
              ))}
            </ul>
            <select className='participants-select' onChange={handleSelectParticipant} defaultValue="">
              <option value="" disabled>참여자 선택</option>
              {projectParticipants.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <textarea className='titleinput'
            name="title"
            value={formData.title}
            placeholder={titlePlaceholder}
            onChange={handleChange}
            required
          />
          <textarea id="autoGrow" className='loginput'
            name="contents"
            ref={textareaRef}
            rows={25}
            value={formData.contents}
            placeholder={detailPlaceholder}
            onChange={handleChange}
            required
          />
          <textarea id="autoGrow" className='fixed'
          name='fix'
          value={formData.fix}
          placeholder={fixPlaceholder}
          onChange={handleChange}
          required
          />
        </div>

        {audioBlob && (
          <div className="audio-preview">
            <h4>기록 미리 듣기</h4>
            <audio ref={audioRef} controls src={URL.createObjectURL(audioBlob)} />
          </div>
        )}

        <button className="end-button" onClick={handleSubmit}>작성 완료</button>
      </div>
    );
  }


  return (
    <div>
      <RecordingComponent />
    </div>
  );
}

export default MeetingLog;
