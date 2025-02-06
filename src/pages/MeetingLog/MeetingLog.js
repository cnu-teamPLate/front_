import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from "react-router-dom";
import { IoMenu, IoMicSharp, IoRecordingOutline } from "react-icons/io5";
import './MeetingLog.css';
const socket = io('http://localhost:3001'); // 백엔드 서버 URL로 교체


function ParticipantSelector({ participants }) {
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const handleSelectParticipant = (event) => {
    const selectedName = event.target.value;
    if (!selectedParticipants.includes(selectedName)) {
      setSelectedParticipants([...selectedParticipants, selectedName]);
    }
  };

  const handleRemoveParticipant = (nameToRemove) => {
    setSelectedParticipants(
      selectedParticipants.filter((name) => name !== nameToRemove)
    );
  };

  return (
    <div className="participants">
      <div className="choose">
        <h4>참여자 선택</h4>
        <select onChange={handleSelectParticipant} defaultValue="">
          <option value="" disabled>참여자 선택</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.name}>{participant.name}</option>
          ))}
        </select>
      </div>
      <div className="dicided">
        <h4>선택된 참여자</h4>
        <ul className="par">
          {selectedParticipants.map((name) => (
            <li key={name}>{name}{' '}
              <button className="delete" onClick={() => handleRemoveParticipant(name)}>삭제</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MeetingLog({ onSave }) {
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const RecordingComponent = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingText] = useState('');
    const [participants, setParticipants] = useState([]);
    const [realTimeData, setRealTimeData] = useState('');
    const [realTimeText, setRealTimeText] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('');
    const navigate = useNavigate();

    const handleRecordButtonClick = async () => {
      setIsRecording((prev) => !prev);
      // 녹음 시작/종료 시 API 호출 로직 추가
    };

    const handleEndButtonClick = () => {
      fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify({ recordingText }),
      });
      navigate('/schedule');
    };

    const fetchMockParticipants = async () => {
      const mockData = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];
      setParticipants(mockData);
    };

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
    };

    return (
      <div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <IoMenu size={24} />
        </button>
        <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-content">Sidebar 내용</div>
        </aside>
        <div className="MeetingLog">
          <button className="record-button" onClick={handleRecordButtonClick}>
            {isRecording ? <IoRecordingOutline size={24} /> : <IoMicSharp size={24} />}
            {isRecording ? "녹음 중" : "녹음하기"}
          </button>
          <div className="meeting-contents">
            <input
              className="titleinput"
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="회의 제목을 입력하세요"
            />
            <ParticipantSelector participants={participants} />
            <textarea
              value={realTimeText}
              onChange={handleEditorChange}
              placeholder="회의 내용을 입력하세요"
              rows={10}
              cols={50}
            />
          </div>
          <button className="end-button" onClick={handleEndButtonClick}>작성 완료</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <RecordingComponent />
    </div>
  );
}

export default MeetingLog;
