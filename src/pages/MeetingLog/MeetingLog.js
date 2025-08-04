import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams} from "react-router-dom";
import { IoMenu, IoMicSharp, IoRecordingOutline } from "react-icons/io5";
import './MeetingLog.css';

const date = new Date();

const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');

const formattedDate = `${year}. ${month}. ${day}`;


const baseURL = "http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080";


function MeetingLog() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [participants, setParticipants] = useState([]);
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
        scheId: '',
        projId: '',
        title: '',
        contents: '',
        fix: '',
        participants: ''
  });

  const { projId } = useParams();
  console.log("projId:", projId)


  const [titlePlaceholder, setTitlePlaceholder] = useState('회의명을 적어주세요');
  const [detailPlaceholder, setDetailPlaceholder] = useState('회의 내용을 적어주세요');

  const [projectParticipants, setProjectParticipants] = useState([]);
  const [meetingParticipants, setMeetingParticipants] = useState([]);
  const handleSelectParticipant = (e) => {
    const selectedName = e.target.value;
    if (!meetingParticipants.includes(selectedName)) {
      setMeetingParticipants([...meetingParticipants, selectedName]);
      }
  };
  const handleRemove = (nameToRemove) => {
    setMeetingParticipants(meetingParticipants.filter(name => name !== nameToRemove));
  };

  const textareaRef = useRef(null);

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
                const response = await fetch(`${baseURL}/member/project/${projId}`);
                if (!response.ok) {
                    throw new Error('프로젝트 멤버 정보를 불러올 수 없습니다.');
                }
                const members = await response.json();
                setProjectParticipants(members);
            } catch (error) {
                console.error("프로젝트 멤버 로딩 오류:", error);
                setProjectParticipants([]);
            }
        };
        fetchProjectMembers();
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
            <h4>참여자</h4>
            <ul>
              {meetingParticipants.map((name) => (
                <li key={name}>
                  {name}
                  <button className="x" onClick={() => handleRemove(name)}>x</button>
                </li>
              ))}
            </ul>
            <select onChange={handleSelectParticipant} defaultValue="">
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
        </div>

        {audioBlob && (
          <div className="audio-preview">
            <h4>기록 미리 듣기</h4>
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
