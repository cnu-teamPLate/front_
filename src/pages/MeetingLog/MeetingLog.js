import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams} from "react-router-dom";
import { IoMenu, IoMicSharp, IoRecordingOutline } from "react-icons/io5";
import './MeetingLog.css';

const API_BASE_URL = 'https://www.teamplate-api.site';
//회의록 수정 api 없음
//최종 수정 시각도 넘겨줘야할 것 같음
//임시 저장이 작동을 안함
//텍스트 변환은 변환할 텍스트가 없다고 떠서 그부분 확인을 못하는 중

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
  const [editMode, setEditMode] = useState(false);

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

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}. ${mm}. ${dd} ${hh}:${min}`;
  };

  //폼 데이터
  const [formData, setFormData] = useState({
        scheId: '',
        projId: projId || '',
        contents: '',
        title: '',
        date: formattedDateTime,
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
  
  //회의록 저장
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
  
    // 🔁 수정 시 meetingId 포함
    if (editMode && selectedLog?.meetingId) {
      param.meetingId = selectedLog.meetingId;
    }
  
    fd.append('param', JSON.stringify(param));
  
    if (audioBlob) {
      fd.append('file', audioBlob, 'recorded_audio.wav');
    }
  
    try {
      const url = editMode
        ? `${API_BASE_URL}/schedule/meeting/update/log`
        : `${API_BASE_URL}/schedule/meeting/upload/log`;
  
      const response = await fetch(url, {
        method: 'POST',
        body: fd,
      });
  
      const result = await response.json().catch(() => ({ message: '응답 파싱 실패' }));
  
      if (response.ok) {
        alert(result.message || (editMode ? '수정 완료!' : '업로드 완료!'));
  
        // 상태 초기화
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
        setEditMode(false);
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
  
  
  //회의록 입력 칸 세팅
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
        fetch(`${API_BASE_URL}/schedule/check/monthly?projId=${projId}&userId=${userId}&standardDate=${formattedDateTime}&cate=meeting`)
      ]);
      
      if (!membersRes.ok || !meetingsRes.ok || !scheduleRes.ok) throw new Error('데이터 로딩 실패');
        setProjectParticipants(await membersRes.json());
        setMeetingData(await meetingsRes.json());
        const res = await scheduleRes.json();
        const flattenedList = Object.values(res.teamSchedules).flat();
        setScheduleList(flattenedList);
      } catch (error) {
        console.error('초기 데이터 로딩 오류:', error);
      }
    };
    
    fetchData();
  }, [projId]);
    
  //회의록 불러옴
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
        try {
          const parsed = JSON.parse(saved);
          console.log("🔍 복구된 임시 데이터:", parsed); // 디버깅 로그
    
          setFormData(parsed);
    
          const participantNames = parsed.participants?.map(p => p.name) || [];
          setMeetingParticipants(participantNames);
    
          setViewMode('new');
          setSelectedLog(null);
        } catch (err) {
          console.error("❌ JSON 파싱 실패:", err);
          alert("임시 저장된 데이터를 불러올 수 없습니다.");
        }
      } else {
        alert("저장된 임시 회의록이 없습니다.");
      }
    };

    useEffect(() => {
      console.log("formData 저장됨:", formData);
      localStorage.setItem('tempMeetingDraft', JSON.stringify(formData));
    }, [formData]);
    
    
  const handleSelectLog = async (log) => {
    if (log.scheId) {
      try {
        const res = await fetch(`${API_BASE_URL}/schedule/meeting/view/log?scheId=${log.scheId}`);
        if (res.ok) {
          const fullLog = await res.json();
          setSelectedLog(fullLog);
          setViewMode('detail');
        } else {
          alert('회의록 상세 조회 실패');
        }
      } catch (err) {
        console.error('상세 조회 오류:', err);
      }
    } else {
      // scheId 없을 때는 이미 받아온 log로 그대로 사용
      setSelectedLog(log);
      setViewMode('detail');
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
                <div className='meeting-schedule'>
                  <h4>일정 선택</h4>
                  <select onChange={handleScheduleSelect}>
                    <option value="">새 회의 생성</option>
                    {scheduleList.map((p) => (
                      <option key={p.scheduleId} value={p.scheduleId}>{p.scheduleName}</option>
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
          )}
          {viewMode === 'detail' && selectedLog && (
            <div className="meeting-log-viewer">
              <div className='top'>
                <h2>{selectedLog.title}</h2>
                <p>{formatDateTime(selectedLog.date)}</p>
                <p>{selectedLog.participants?.map(p => p.name).join(', ')}</p>
              </div>
              <div><p><strong>내용</strong></p><p>{selectedLog.contents}</p></div>
              <div><p><strong>확정사항</strong></p><p> {selectedLog.fix}</p></div>
              <div className='button-row'>
                <button onClick={() => setViewMode('new')}>← 돌아가기</button>
                <button
                  onClick={() => {
                    setFormData({
                      scheId: selectedLog.scheId || '',
                      projId: selectedLog.projId || projId,
                      contents: selectedLog.contents || '',
                      title: selectedLog.title || '',
                      date: selectedLog.date || formattedDateTime,
                      fix: selectedLog.fix || '',
                      participants: selectedLog.participants || [],
                    });

                    const names = selectedLog.participants?.map(p => p.name) || [];
                    setMeetingParticipants(names);

                    setEditMode(true);
                    setViewMode('new');
                  }}
                >
                  수정하기
                </button>
              </div>
            </div>
          )}

        <div className="meetinglog-list" style={{ flex: 1 }}>
          {localStorage.getItem('tempMeetingDraft') && (
            <div
              style={{ background: '#f0f0f0', padding: '8px', marginBottom: '10px', cursor: 'pointer' }}
              onClick={loadTempDraft}
            >
              임시 저장 불러오기
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
              <p style={{ fontSize: '12px', color: '#555' }}>{formatDateTime(log.date)}</p>
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
