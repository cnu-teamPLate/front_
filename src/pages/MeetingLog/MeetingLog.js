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

const API_BASE_URL = 'https://www.teamplate-api.site';



function MeetingLog() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [participants, setParticipants] = useState([]);
  const navigate = useNavigate();

  const [statusMessage, setStatusMessage] = useState('');
  const [viewMode, setViewMode] = useState('new'); // 'list' | 'detail' | 'new'
  const [selectedLog, setSelectedLog] = useState(null);


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

  const [meetingData, setMeetingData] = useState([]);

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


  useEffect(() => {
    localStorage.setItem('tempMeetingDraft', JSON.stringify(formData));
  }, [formData]);

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

  useEffect(()=> {
    const logList = async() => {
      const baseUrl = 'https://www.teamplate-api.site'
  
      try {
        const response = await fetch(`${API_BASE_URL}/schedule/meeting/view/log?projId=${projId}`);
        if(!response.ok) {
          throw new Error('회의록을 가져오는 데 실패했습니다.');
        }
        const data = await response.json();
        setMeetingData(data); // 받아온 데이터 저장
  
      } catch (error) {
        console.error('에러 발생:', error);
      }
    };
    logList();
  }, [projId]);

  
  const audioRef = useRef(null);

  const sendAudioToSpeechToTextAPI = async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'recorded_audio.wav');
  
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/meeting/convert-speech`, {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
  
      // 텍스트 응답 예시: { text: "회의를 시작하겠습니다." }
      if (data && data.text) {
        setFormData(prev => ({
          ...prev,
          contents: prev.contents
          ? `${prev.contents}\n\n[자동 변환된 텍스트]\n${data.text}`
          : data.text,
        }));
      } else {
        alert('텍스트 변환 결과가 없습니다.');
      }
  
    } catch (error) {
      console.error('텍스트 변환 실패:', error);
      alert('오디오를 텍스트로 변환하는 데 실패했습니다.');
    }
  };

  const handleRecordButtonClick = async () => {
    if (!isRecording) {
      // 🔴 녹음 시작
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
  
        recorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };
  
        recorder.onstop = async() => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          setAudioBlob(blob);
  
          // 예: blob에서 오디오 URL 생성해서 미리듣기
          if (audioRef.current) {
            audioRef.current.src = URL.createObjectURL(blob);
          }
          await sendAudioToSpeechToTextAPI(blob);
        };
  
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (err) {
        console.error("오디오 접근 실패:", err);
        alert("마이크 접근 권한을 허용해주세요.");
      }
    } else {
      // ⏹️ 녹음 중지
      mediaRecorder?.stop();
      setIsRecording(false);
    }
  };



  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


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
      });

      const responseData = await response.json().catch(() => {
        return response.text().then(text => ({ message: text || `서버 응답 파싱 실패 (상태: ${response.status})` }));
      });

      if (response.ok) {
        localStorage.removeItem('tempMeetingDraft'); 
        setStatusMessage(responseData.message || '업로드 완료되었습니다!');
        setFormData(prev => ({
          ...prev, scheId: '', projId: '', contents: '', title: '', date: '', fix:'', participants:[]
        }));
      }
    } catch (error) {
      console.error('업로드 중 네트워크 또는 기타 오류:', error);
      setStatusMessage(`업로드 실패: ${error.message}`);
    }
  };

  const handleSelectLog = (log) => {
    // 작성 중이던 내용 임시 저장 (자동 저장되어 있지만 명시적으로 다시 저장)
    localStorage.setItem('tempMeetingDraft', JSON.stringify(formData));

    setSelectedLog(log);
    setViewMode('detail');
  };

  // 🧠 임시 저장 불러오기
  const loadTempDraft = () => {
    const saved = localStorage.getItem('tempMeetingDraft');
    if (saved) {
      setFormData(JSON.parse(saved));
      setSelectedLog(null);
      setViewMode('new');
    }
  };

  return (
      <div>
        <div className="meeting-log-container" style={{ display: 'flex', gap: '20px' }}>
          {viewMode === 'new' && (
            <div className="MeetingLog" style={{ flex: 2 }}>
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
                <div>
                  <h4>일정 선택</h4>
                  <select>
                    <option value="">새 회의 생성</option>

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
          )}
          {viewMode === 'detail' && selectedLog && (
            <div className="meeting-log-viewer">
              <h2>{selectedLog.title}</h2>
              <p><strong>날짜:</strong> {selectedLog.date}</p>
              <p><strong>내용:</strong> {selectedLog.contents}</p>
              <p><strong>확정사항:</strong> {selectedLog.fix}</p>
              <button onClick={() => setViewMode('new')}>← 돌아가기</button>
            </div>
          )}

        <div className="meetinglog-list" style={{ flex: 1 }}>
          {localStorage.getItem('tempMeetingDraft') && (
            <div
              style={{ background: '#f0f0f0', padding: '8px', marginBottom: '10px', cursor: 'pointer' }}
              onClick={loadTempDraft}
            >
              📝 임시 저장된 회의록 불러오기
            </div>
          )}

          {meetingData.length > 0 && meetingData.map((log, idx) => (
            <div
              key={idx}
              className="each"
              onClick={() => handleSelectLog(log)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #ddd', marginBottom: '10px' }}
            >
              <p><strong>{log.title}</strong></p>
              <p style={{ fontSize: '12px', color: '#555' }}>{log.date}</p>
            </div>
          ))}
          {meetingData.length === 0 &&(
            <p>회의록이 없습니다.</p>
            )
          }
        </div>
      </div>
    </div>
      
);
}

export default MeetingLog;
