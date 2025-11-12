import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams} from "react-router-dom";
import { IoMenu, IoMicSharp, IoRecordingOutline } from "react-icons/io5";
import './MeetingLog.css';

const API_BASE_URL = 'https://www.teamplate-api.site';

function MeetingLog() {
  //음성 녹음 관련
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const userId = localStorage.getItem("userId");
  //참여자 정보 불러오기
  const [projectParticipants, setProjectParticipants] = useState([]);
  const [meetingParticipants, setMeetingParticipants] = useState([]);
  const [participants, setParticipants] = useState([]);
  //일정 불러오기
  const [scheduleList, setScheduleList] = useState([]);
  const [meetingData, setMeetingData] = useState([]);
  const [viewMode, setViewMode] = useState('new'); // 'list' | 'detail' | 'new'

  //회의록 작성 관련
  const [titlePlaceholder, setTitlePlaceholder] = useState('회의명을 적어주세요');
  const [detailPlaceholder, setDetailPlaceholder] = useState('회의 내용을 적어주세요');
  const [fixPlaceholder, setFixPlaceholder] = useState('확정된 내용을 정리해주세요');


  const [selectedLog, setSelectedLog] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const navigate = useNavigate();

  const { projId } = useParams();
  console.log("projId:", projId)
  const textareaRef = useRef(null);
  const audioRef = useRef(null);

  //오늘 날짜
  const now = new Date();
  const formattedDate = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
  const formattedDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  //폼 데이터
  const [formData, setFormData] = useState({
        scheId: '',
        projId: '',
        contents: '',
        title: '',
        date: '',
        fix: '',
        participants: [],
  });
  //참여자 정보
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

  //일정 불러오기
  const handleScheduleSelect = (e) => {
    const selectedId = e.target.value;
    const selectedSchedule = scheduleList.find(s => s.scheId === selectedId);
    setFormData(prev => ({
    ...prev,
    scheId: selectedId,
    date: selectedSchedule ? selectedSchedule.date : formattedDateTime,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    };
    
  //음성 인식 관련
  const handleRecordButtonClick = async () => {
    if (!isRecording) {
    try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    
    
    recorder.ondataavailable = (e) => chunks.push(e.data);
    
    
    recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    setAudioBlob(blob);
    if (audioRef.current) {
    audioRef.current.src = URL.createObjectURL(blob);
    }
    await sendAudioToSpeechToTextAPI(blob);
    };
    
    
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    } catch (err) {
    alert("마이크 접근 권한을 허용해주세요.");
    }
    } else {
    mediaRecorder?.stop();
    setIsRecording(false);
    }
  };
    
    
  const sendAudioToSpeechToTextAPI = async (blob) => {
    const fd = new FormData();
    fd.append('file', blob, 'recorded_audio.wav');
    try {
    const res = await fetch(`${API_BASE_URL}/schedule/meeting/convert-speech`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data?.text) {
    setFormData(prev => ({
    ...prev,
    contents: prev.contents ? `${prev.contents}\n\n[자동 변환된 텍스트]\n${data.text}` : data.text
    }));
    } else {
    alert('텍스트 변환 결과가 없습니다.');
    }
    } catch {
    alert('STT 변환 실패');
    }
  };
    
    
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.title || !formData.contents) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }
  
    const fd = new FormData();
    const param = {
      projId: formData.projId,
      contents: formData.contents,
      title: formData.title,
      date: formData.date,
      fix: formData.fix,
      participants: formData.participants,
    };
    if (formData.scheId && formData.scheId !== '') {
      param.scheId = formData.scheId;
    }
    fd.append('param', JSON.stringify(param));
  
    if (audioBlob) {
      fd.append('file', audioBlob, 'recorded_audio.wav');
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/schedule/meeting/upload/log`, {
        method: 'POST',
        body: fd,
      });
  
      const result = await response.json().catch(() => ({ message: '응답 파싱 실패' }));
  
      if (response.ok) {
        alert(result.message || '업로드 완료!');
        setFormData({
          scheId: '',
          projId: projId,
          contents: '',
          title: '',
          date: '',
          fix: '',
          participants: [],
        });
        setMeetingParticipants([]);
        setAudioBlob(null);
        localStorage.removeItem('tempMeetingDraft');
        await fetchMeetingLogs();
      } else {
        alert(result.message || '업로드 실패');
      }
    } catch (err) {
      console.error('업로드 중 오류:', err);
      alert('서버 오류: ' + err.message);
    }
  };
  
  useEffect(() => {
    setFormData(prev => {
      if (!prev.projId) {
        return { ...prev, projId };
      }
      return prev;
    });
      const fetchData = async () => {
      try {
      const [membersRes, meetingsRes, scheduleRes] = await Promise.all([
        fetch(`${API_BASE_URL}/member/project/${projId}`),
        fetch(`${API_BASE_URL}/schedule/meeting/view/log?projId=${projId}`),
        fetch(`${API_BASE_URL}/schedule/check/monthly?projId=${projId}&userId=${userId}&standardDate=${formattedDateTime}&cate=plan`)
      ]);
      
      if (!membersRes.ok || !meetingsRes.ok || !scheduleRes.ok) throw new Error('데이터 로딩 실패');
        setProjectParticipants(await membersRes.json());
        setMeetingData(await meetingsRes.json());
        setScheduleList(await scheduleRes.json());
      } catch (error) {
        console.error('초기 데이터 로딩 오류:', error);
      }
    };
    
    fetchData();
  }, [projId]);
    
    
    useEffect(() => {
    localStorage.setItem('tempMeetingDraft', JSON.stringify(formData));
    }, [formData]);

    const fetchMeetingLogs = async () => {
      const res = await fetch(`${API_BASE_URL}/schedule/meeting/view/log?projId=${projId}`);
      if (res.ok) {
        const logs = await res.json();
        setMeetingData(logs);
      }
    };
    
    
    const loadTempDraft = () => {
      const saved = localStorage.getItem('tempMeetingDraft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
    
        // ✅ 참가자 리스트도 별도로 반영
        const participantNames = parsed.participants?.map(p => p.name) || [];
        setMeetingParticipants(participantNames);
    
        // ✅ 보기 모드도 작성 모드로
        setViewMode('new');
        setSelectedLog(null);
      } else {
        alert("저장된 임시 회의록이 없습니다.");
      }
    };

    useEffect(() => {
      localStorage.setItem('tempMeetingDraft', JSON.stringify(formData));
    }, [formData.title, formData.contents, formData.fix, formData.scheId, formData.participants]);
    
    
    
  const handleSelectLog = (log) => {
    setSelectedLog(log);
    setViewMode('detail');
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
              <button>수정하기</button>
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
