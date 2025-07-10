import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { IoMenu, IoMicSharp, IoRecordingOutline } from "react-icons/io5";
import './MeetingLog.css';


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

function MeetingLog() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [participants, setParticipants] = useState([]);
  const navigate = useNavigate();
  const audioRef = useRef(null);
  useEffect(() => {
    fetchMockParticipants();
  }, []);

  const fetchMockParticipants = async () => {
    const mockData = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];
    setParticipants(mockData);
  };

  const RecordingComponent = () => {

    //const [recordingText] = useState('');
    //const [realTimeData, setRealTimeData] = useState('');
    //const [realTimeText, setRealTimeText] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('');
    const navigate = useNavigate();

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


    return (
      <div className="MeetingLog">
        <h2>Meeting Log</h2>
        <div className="controls">
          <button onClick={handleRecordButtonClick}>
            {isRecording ? <IoRecordingOutline size={24} /> : <IoMicSharp size={24} />}
            {isRecording ? "녹음 중" : "녹음하기"}
          </button>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="회의 제목을 입력하세요"
          />
        </div>

        <div className="participants">
          <h4>참여자 선택</h4>
          <select defaultValue="">
            <option value="" disabled>참여자 선택</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.name}>
                {participant.name}
              </option>
            ))}
          </select>
        </div>

        {audioBlob && (
          <div className="audio-preview">
            <h4>녹음 미리 듣기</h4>
            <audio ref={audioRef} controls src={URL.createObjectURL(audioBlob)} />
          </div>
        )}

        <button className="end-button" onClick={handleEndButtonClick}>작성 완료</button>
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
