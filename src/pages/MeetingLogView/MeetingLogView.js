import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoMenu} from "react-icons/io5";
import './MeetingLogView.css';

function ParticipantSelector({participants = [], selectedParticipants, onParticipantChange}) {
  return (
    <div>
      <select multiple value={selectedParticipants} onChange={(e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
        onParticipantChange(selectedOptions);
      }}>
        {participants.map((participant, index) => (
          <option key={index} value={participant}>
            {participant}
          </option>
        ))}
      </select>
    </div>
  );
};

function MeetingLogView() {
  const { date } = useParams(); // URL에서 날짜를 가져옵니다.
  const navigate = useNavigate();
  const [meetingLog, setMeetingLog] = useState({
    title: "회의 제목 오는 자리",  // 초기값 설정
    date: "오늘",                  // 초기값 설정
    participants: [],               // 초기값 설정
    recordings: [],                 // 초기값 설정
    content: "회의 내용",   
  });
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [recordedFiles, setRecordedFiles] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
};

  const handleSave = () => {
    const updatedMeetingLog = {
      title: meetingLog.title,
      date: meetingLog.date,
      participants: selectedParticipants,
      recordings:recordedFiles,
      content: meetingLog.content,
    };

    console.log("저장 전 meetingLog 상태:", meetingLog);
    /*
    fetch('/api/meetinglog', {
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body:JSON.stringify(updatedMeetingLog),
    })
      .then(response => response.json())
      .then(data => {
        console.log("저장 완료:", data);
        setMeetingLog(updatedMeetingLog);
        console.log("업데이트된 meetingLog 상태:", updatedMeetingLog);
        setIsEditing(false);
        console.log("isEditing 상태:", false);
      })
      .catch(error => {
        console.error("저장 중 에러 발생:", error);
      });  
    */
    //임시로 상태만 업데이트
    setMeetingLog(updatedMeetingLog);
    setIsEditing(false);
    console.log("isEditing 상태:", false)
  };

  const handleParticipantChange = (selectedOptions) => {
    setSelectedParticipants(selectedOptions);
  };

  const handleDelete = () => {
    const confirmed = window.confirm("회의록을 삭제하시겠습니까?");

    if (confirmed) {
      navigate('/schedule');
    }
  }


  useEffect(() => {
    console.log("useEffect 실행됨");
    // 해당 날짜의 회의록 데이터를 가져오는 함수
    const fetchMeetingLog = async () => {
      try {
        const response = await fetch(`/api/meetinglog/${date}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg = errorData?.message || `데이터를 불러올 수 없습니다 (${response.status})`;
          throw new Error(errorMsg);
        }
        const data = await response.json();
        setMeetingLog(data);
        setSelectedParticipants(data.participants);
      } catch (error) {
        console.error("데이터 가져오기 중 에러:", error);
        alert(`회의록 데이터를 불러올 수 없습니다: ${error.message || '네트워크 오류가 발생했습니다.'}`);
      }
    };
    
    fetchMeetingLog();
  }, [date]);

  
  return (
    <div>
      <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-content">
              <p>aa</p>
          </div>
      </aside>
      <div className="container">
        <div className="editable-post">
          {isEditing ? (
            <div className="edit">
              <h1>{meetingLog.title}</h1>
              <div className="participants-group">
                <h4>참여자</h4>
                <ParticipantSelector
                  participants={meetingLog.participants}
                  selectedParticipants={selectedParticipants}
                  onParticipantChange={handleParticipantChange}
                />
              </div>
              <div>여기에 실시간 수정 api 받아오기</div>
              <div>
                {recordedFiles.map((file, index) => (
                  <div key={index}>{file}</div>
                ))}
              </div>
              <button className="end-button" onClick={handleSave}>저장</button>
            </div>
          ) : (
            <div className = "view-meetinglog">
              <h2>{meetingLog.title}</h2>
              <p><strong>회의 날짜:</strong> {meetingLog.date}</p>
              <p><strong>회의 참여자:</strong> {meetingLog.participants.join(", ")}</p>
              <p><strong>회의 녹음 내용:</strong>{/* 여기에 녹음 파일 불러오는 코드 써야함*/}</p>
              <div>
                <ul>
                  {meetingLog.recordings.map((recording, index) => (
                    <li key={index}>
                      <a href={recording.url} download>{recording.filename}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className = "what-contents">
                <p><strong className = "contents-title">회의 내용:</strong> {meetingLog.content} </p>
              </div>
              <button onClick={() => setIsEditing(true)}>수정</button>
              <button onClick={handleDelete}>삭제</button>
            
            </div>

          )}
            
        </div>
      </div>
    </div>
  );
};

export default MeetingLogView;