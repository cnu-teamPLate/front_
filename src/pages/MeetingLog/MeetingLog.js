import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams} from "react-router-dom";
import { IoMenu, IoMicSharp, IoRecordingOutline } from "react-icons/io5";
import './MeetingLog.css';

const API_BASE_URL = 'https://www.teamplate-api.site';

// Debounce 유틸리티 함수
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function MeetingLog() {
  //음성 녹음 관련 - ref로 관리하여 cleanup 안정화
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

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

  // Debounce된 formData (500ms 지연)
  const debouncedFormData = useDebounce(formData, 500);

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
    const updatedList = meetingParticipants.filter(name => name !== nameToRemove);
    setMeetingParticipants(updatedList);
    setFormData(prev => ({
      ...prev,
      participants: updatedList.map(name => {
        const matched = projectParticipants.find(p => p.name === name);
        return matched ? { name: matched.name, id: matched.id } : { name, id: '' };
      })
    }));
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
    
  //음성 인식 관련 - 리소스 정리 개선
  const handleRecordButtonClick = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream; // ref에 저장
        
        // 브라우저가 지원하는 MIME 타입 확인
        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
        
        console.log('사용할 MIME 타입:', mimeType);
        
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: mimeType });
          
          // Blob 크기 검증
          if (blob.size === 0) {
            console.error('생성된 오디오 Blob이 비어있습니다.');
            alert('녹음된 오디오가 비어있습니다. 다시 녹음해주세요.');
            return;
          }
          
          console.log('오디오 Blob 생성 완료:', { size: blob.size, type: blob.type });
          setAudioBlob(blob);
          
          if (audioRef.current) {
            const oldUrl = audioRef.current.src;
            audioRef.current.src = URL.createObjectURL(blob);
            // 이전 URL 정리
            if (oldUrl && oldUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldUrl);
            }
          }
          
          // 스트림 정리
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          await sendAudioToSpeechToTextAPI(blob);
        };
        
        recorder.start();
        mediaRecorderRef.current = recorder; // ref에 저장
        setIsRecording(true);
      } catch (err) {
        console.error('마이크 접근 오류:', err);
        alert("마이크 접근 권한을 허용해주세요.");
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  // 컴포넌트 언마운트 시 리소스 정리
  useEffect(() => {
    return () => {
      // MediaRecorder 정리
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      
      // 스트림 정리
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // 오디오 URL 정리
      if (audioRef.current && audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);
    
  // 텍스트 변환 기능 개선
  const sendAudioToSpeechToTextAPI = async (blob) => {
    // audioBlob 검증
    if (!blob || blob.size === 0) {
      console.error('변환할 오디오 Blob이 없거나 비어있습니다.');
      alert('변환할 오디오가 없습니다. 다시 녹음해주세요.');
      return;
    }

    // 파일 크기 검증 (예: 최소 1KB, 최대 10MB)
    const minSize = 1024; // 1KB
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (blob.size < minSize) {
      console.error('오디오 파일이 너무 작습니다:', blob.size);
      alert('녹음 시간이 너무 짧습니다. 최소 1초 이상 녹음해주세요.');
      return;
    }
    
    if (blob.size > maxSize) {
      console.error('오디오 파일이 너무 큽니다:', blob.size);
      alert('오디오 파일이 너무 큽니다. 파일 크기를 줄여주세요.');
      return;
    }

    setIsConverting(true);
    
    const fd = new FormData();
    // 파일 확장자를 MIME 타입에 맞게 설정
    const fileExtension = blob.type.includes('webm') ? 'webm' : 
                         blob.type.includes('ogg') ? 'ogg' : 
                         blob.type.includes('mp4') ? 'mp4' : 'wav';
    fd.append('file', blob, `recorded_audio.${fileExtension}`);
    
    console.log('STT API 호출:', {
      url: `${API_BASE_URL}/schedule/meeting/convert-speech`,
      fileSize: blob.size,
      fileType: blob.type,
      formDataKeys: Array.from(fd.keys())
    });
    
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/meeting/convert-speech`, { 
        method: 'POST', 
        body: fd 
      });
      
      console.log('STT API 응답:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => '알 수 없는 오류');
        console.error('STT API 오류 응답:', errorText);
        throw new Error(`서버 오류 (${res.status}): ${errorText}`);
      }
      
      const data = await res.json().catch(async () => {
        const text = await res.text();
        console.error('JSON 파싱 실패, 응답 텍스트:', text);
        throw new Error('서버 응답을 파싱할 수 없습니다.');
      });
      
      console.log('STT 변환 결과:', data);
      
      // 응답 형식 검증 - 여러 가능한 필드명 확인
      const convertedText = data?.text || data?.transcript || data?.result || data?.content;
      
      if (convertedText && typeof convertedText === 'string' && convertedText.trim()) {
        setFormData(prev => ({
          ...prev,
          contents: prev.contents ? `${prev.contents}\n\n[자동 변환된 텍스트]\n${convertedText}` : convertedText
        }));
        console.log('텍스트 변환 완료');
      } else {
        console.warn('변환된 텍스트가 없거나 비어있습니다:', data);
        alert('텍스트 변환 결과가 없습니다. 다시 시도해주세요.');
      }
    } catch (err) {
      console.error('STT 변환 실패:', err);
      alert('STT 변환 실패: ' + (err.message || '네트워크 오류가 발생했습니다.'));
    } finally {
      setIsConverting(false);
    }
  };
  
  //회의록 저장 - API 에러 핸들링 개선
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.title || !formData.contents) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    // 수정 모드일 때 scheId 필수 검증
    if (editMode && (!formData.scheId || formData.scheId === '')) {
      alert("일정 ID(scheId)는 필수입니다. 일정을 선택해주세요.");
      return;
    }

    setIsUploading(true);
  
    try {
      let response;
      
      if (editMode) {
        // 수정 API: PUT /schedule/meeting/update/log
        // Content-Type: application/json
        const requestBody = {
          scheId: formData.scheId, // 필수
          contents: formData.contents,
          title: formData.title,
          date: formData.date,
          fix: formData.fix,
          participants: formData.participants,
          sttContents: formData.contents // STT 변환된 내용 (현재는 contents와 동일하게 설정)
        };
        
        // 수정할 필드에 대해서만 값을 넣어 보내면 됨 (scheId는 필수)
        // 빈 값이 아닌 필드만 포함
        const cleanedBody = {};
        if (requestBody.scheId) cleanedBody.scheId = requestBody.scheId;
        if (requestBody.contents) cleanedBody.contents = requestBody.contents;
        if (requestBody.title) cleanedBody.title = requestBody.title;
        if (requestBody.date) cleanedBody.date = requestBody.date;
        if (requestBody.fix) cleanedBody.fix = requestBody.fix;
        if (requestBody.participants && requestBody.participants.length > 0) cleanedBody.participants = requestBody.participants;
        if (requestBody.sttContents) cleanedBody.sttContents = requestBody.sttContents;
        
        console.log('수정 API 호출:', {
          url: `${API_BASE_URL}/schedule/meeting/update/log`,
          method: 'PUT',
          body: cleanedBody
        });
        
        response = await fetch(`${API_BASE_URL}/schedule/meeting/update/log`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedBody),
        });
      } else {
        // 업로드 API: POST /schedule/meeting/upload/log
        // FormData 사용
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
        
        // 파일 업로드 검증
        if (audioBlob) {
          // 파일 크기 검증
          const maxFileSize = 10 * 1024 * 1024; // 10MB
          if (audioBlob.size > maxFileSize) {
            alert('오디오 파일이 너무 큽니다. (최대 10MB)');
            setIsUploading(false);
            return;
          }
          
          // 파일 타입 검증
          if (!audioBlob.type.startsWith('audio/')) {
            console.warn('오디오 파일 타입이 아닙니다:', audioBlob.type);
          }
          
          fd.append('file', audioBlob, 'recorded_audio.wav');
          console.log('파일 첨부:', { size: audioBlob.size, type: audioBlob.type });
        }
        
        console.log('업로드 API 호출:', {
          url: `${API_BASE_URL}/schedule/meeting/upload/log`,
          method: 'POST',
          paramKeys: Object.keys(param),
          hasFile: !!audioBlob
        });
        
        response = await fetch(`${API_BASE_URL}/schedule/meeting/upload/log`, {
          method: 'POST',
          body: fd,
        });
      }
  
      console.log('API 응답:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
  
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('JSON 파싱 실패:', text);
        throw new Error(`서버 응답을 파싱할 수 없습니다. (${response.status})`);
      }
  
      if (response.ok) {
        console.log('저장 성공:', result);
        alert(result.message || (editMode ? '수정 완료!' : '업로드 완료!'));
  
        // 상태 초기화
        setFormData({
          scheId: '',
          projId: projId,
          contents: '',
          title: '',
          date: formattedDateTime,
          fix: '',
          participants: [],
        });
        setMeetingParticipants([]);
        setAudioBlob(null);
        setEditMode(false);
        localStorage.removeItem('tempMeetingDraft');
        await fetchMeetingLogs();
      } else {
        // 상세한 에러 메시지
        let errorMsg = result?.message || result?.error || `업로드 실패 (${response.status})`;
        
        // API 문서에 따른 에러 메시지 처리
        if (response.status === 400) {
          errorMsg = result?.message || '등록되지 않은 회의록입니다.';
        } else if (response.status === 404) {
          errorMsg = result?.message || '존재하지 않는 사용자, 프로젝트 또는 스케줄 ID입니다.';
        }
        
        console.error('저장 실패:', result);
        alert(errorMsg);
      }
    } catch (err) {
      console.error('업로드 중 오류:', err);
      const errorMsg = err.message || '네트워크 오류가 발생했습니다.';
      alert('서버 오류: ' + errorMsg);
    } finally {
      setIsUploading(false);
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
      
      if (!membersRes.ok || !meetingsRes.ok || !scheduleRes.ok) {
        const errors = [];
        if (!membersRes.ok) errors.push(`멤버 조회 실패 (${membersRes.status})`);
        if (!meetingsRes.ok) errors.push(`회의록 조회 실패 (${meetingsRes.status})`);
        if (!scheduleRes.ok) errors.push(`일정 조회 실패 (${scheduleRes.status})`);
        throw new Error(errors.join(', '));
      }
      
        setProjectParticipants(await membersRes.json());
        setMeetingData(await meetingsRes.json());
        const res = await scheduleRes.json();
        const flattenedList = Object.values(res.teamSchedules).flat();
        setScheduleList(flattenedList);
      } catch (error) {
        console.error('초기 데이터 로딩 오류:', error);
        alert('데이터 로딩 실패: ' + error.message);
      }
    };
    
    fetchData();
  }, [projId]);
    
  // 로컬 스토리지 임시 저장 - debounce 적용 및 로그 추가
  useEffect(() => {
    // 초기 로드 시에는 저장하지 않음 (빈 formData일 때)
    if (!debouncedFormData || (!debouncedFormData.title && !debouncedFormData.contents)) {
      return;
    }
    
    const dataToSave = {
      ...debouncedFormData,
      // audioBlob는 저장하지 않음 (너무 큼)
    };
    
    console.log('임시 저장:', {
      timestamp: new Date().toISOString(),
      title: dataToSave.title,
      contentsLength: dataToSave.contents?.length || 0,
      participantsCount: dataToSave.participants?.length || 0
    });
    
    try {
      localStorage.setItem('tempMeetingDraft', JSON.stringify(dataToSave));
      console.log('임시 저장 완료');
    } catch (err) {
      console.error('임시 저장 실패:', err);
      // localStorage 용량 초과 등의 경우
      if (err.name === 'QuotaExceededError') {
        console.warn('localStorage 용량 초과');
      }
    }
  }, [debouncedFormData]);

  // 초기 로드 시 임시 저장된 데이터 복원
  useEffect(() => {
    const saved = localStorage.getItem('tempMeetingDraft');
    if (saved && !editMode) {
      try {
        const parsed = JSON.parse(saved);
        // 빈 데이터가 아닌 경우에만 복원
        if (parsed.title || parsed.contents) {
          console.log('초기 로드 시 임시 저장 데이터 복원:', parsed);
          setFormData(prev => ({
            ...prev,
            ...parsed,
            projId: parsed.projId || projId, // projId는 현재 프로젝트로 유지
          }));
          
          const participantNames = parsed.participants?.map(p => p.name) || [];
          setMeetingParticipants(participantNames);
        }
      } catch (err) {
        console.error('초기 로드 시 임시 저장 데이터 파싱 실패:', err);
      }
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  const fetchMeetingLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/schedule/meeting/view/log?projId=${projId}`);
      if (res.ok) {
        const logs = await res.json();
        setMeetingData(logs);
      } else {
        console.error('회의록 조회 실패:', res.status);
      }
    } catch (err) {
      console.error('회의록 조회 오류:', err);
    }
  };
    
  const handleSelectLog = async (log) => {
    if (log.scheId) {
      try {
        const res = await fetch(`${API_BASE_URL}/schedule/meeting/view/log?scheId=${log.scheId}`);
        if (res.ok) {
          const fullLog = await res.json();
          setSelectedLog(fullLog);
          setViewMode('detail');
        } else {
          const errorText = await res.text().catch(() => '알 수 없는 오류');
          console.error('회의록 상세 조회 실패:', res.status, errorText);
          alert('회의록 상세 조회 실패: ' + errorText);
        }
      } catch (err) {
        console.error('상세 조회 오류:', err);
        alert('회의록을 불러오는 중 오류가 발생했습니다.');
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
                <button 
                  className="record-button" 
                  onClick={handleRecordButtonClick}
                  disabled={isConverting || isUploading}
                >
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
              <button 
                className="end-button" 
                onClick={handleSubmit}
                disabled={isUploading || isConverting}
              >
                {isUploading ? '저장 중...' : '작성 완료'}
              </button>
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
