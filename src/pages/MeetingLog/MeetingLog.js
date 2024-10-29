import React, { useEffect, useState } from 'react';
import {useNavigate} from "react-router-dom";
import { IoMenu, IoPerson,IoMicSharp, IoRecordingOutline  } from "react-icons/io5";
import './MeetingLog.css';


function ParticipantSelector ({ participants}) {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
      
    // 드롭다운에서 참여자를 선택할 때 호출되는 함수
  const handleSelectParticipant = (event) => {
    const selectedName = event.target.value;
      
      // 이미 선택된 사람이 아니라면 추가
    if (!selectedParticipants.includes(selectedName)) {
      setSelectedParticipants([...selectedParticipants, selectedName]);
    }
  };
      
  // 선택된 참여자를 삭제하는 함수
  const handleRemoveParticipant = (nameToRemove) => {
    setSelectedParticipants(
      selectedParticipants.filter((name) => name !== nameToRemove)
    );
  };
      
  

  return (
    <div className = "participants" >
      <div className = "choose">
        <h4>참여자 선택</h4>
        <select onChange={handleSelectParticipant} defaultValue="">
          <option value="" disabled>
            참여자 선택
          </option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.name}>
              {participant.name}
            </option>
          ))}
        </select>
      </div>
      <div className = "dicided">
        <h4>선택된 참여자</h4>
        <ul className="par">
          {selectedParticipants.map((name) => (
            <li key={name}>
              {name}{' '}
              <button className = "delete" onClick={() => handleRemoveParticipant(name)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
        
      </div>
    </div>
  );
}

/*api의 css 수정 가능한 정도를 보고 회의제목 입력 받는 코드를 넣을지 말지 결정하기*/


function MeetingLog({onSave}) {
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const RecordingComponent = () => {
      const [isRecording, setIsRecording] = useState(false);
      const [recordedFiles, setRecordedFiles] = useState([]);
      const [recordingText, setRecordingText] = useState('');
      const [userInput, setUserInput] = useState('');
      const [participants, setParticipants] = useState([]);
      const navigate = useNavigate();
      const [selectedParticipants, setSelectedParticipants] = useState([]);
      const [realTimeData, setRealTimeData] = useState('');
      const [realTimeText, setRealTimeText] = useState('');
      const [meetingTitle, setMeetingTitle] = useState('');
    

      const handleRecordButtonClick = async () => {
        
        if (!isRecording) {
          /*녹음 시작*/
          setIsRecording(true);
          /*녹음 시작 api 호출*/
        } else {
          setIsRecording(false);
          /*녹음 종료 api 호출 후 녹음본 텍스트 변환*/
          const transcription = await fetch('api써야함');
          setRecordingText(transcription);
          /*녹음본을 저장할 것인지 묻는 팝업*/
          if (window.confirm('녹음 파일을 저장하시겠습니까?')) {
            /*파일 저장 api 호출*/
            fetch('api 써야함', {method: 'POST'});
          }
        }
      };

      const handleEndButtonClick =  () => {
        fetch('notyet', {
          method: 'POST',
          body: JSON.stringify({
            recordingText,
            userInput,
          }),
        });
        
        window.location.href = '/schedule';
      };

      const fetchRealTimeData = async () => {
        try{
          const response = await fetch("실시간 편집 api 엔드포인트");
          const realTimeData = await response.json();
          setRealTimeData(realTimeData);
        } catch (error) {
          console.error('실시간 데이터 불러오기 실패:',error);
        }
      };

      const fetchMockParticipants = async () => {
        const mockData = [
          {id: 1, name : 'Alice'},
          {id:2, name:'Bob'},
          {id:3, name:'Charlie'},
          {id: 4, name:'David'},
          {id: 5, name: 'Eve'},
        ];

        await new Promise((resolve) => setTimeout(resolve, 500));
        setParticipants(mockData);
        //api 요청을 흉내내는 부분. 500ms 지연 후 저장
      };
      useEffect(() => {
        fetchMockParticipants();
        fetchRealTimeData();

        const intervalId = setInterval (fetchRealTimeData, 5000);
        return () => clearInterval(intervalId);
      }, []);
      
      //DB에 저장하는 함수
      const saveParticipantsToDB = (selectedParticipants) => {
        fetch('/api/saveParticipants', {//fetch는 네트워크 요청 보낼 때 사용
          method: 'POST', //서버에 데이터를 보내기 위해 포스트 요청
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({participants: selectedParticipants}),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('DB 저장 성공:', data);
          })
          .catch((error) => {
            console.error('DB 저장 실패:', error);
          });
      };

      // DB에 저장하는 로직은 상위 컴포넌트에서 처리하도록 함수를 호출
      const handleSubmitToDB = () => {
        onSave(selectedParticipants); // 상위 컴포넌트에서 전달된 함수 호출
      };


      return (
        <div>
          <header>
            <div className="my-page-logout">
            <IoPerson size={24} />
            <a href="/mypage">마이페이지</a> | <a href="/logout">로그아웃</a>
            </div>
          </header>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <IoMenu size={24} />
          </button>
          <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-content">
                <p>aa</p>
            </div>
          </aside>
          {/*녹음 버튼 누르면 녹음 기능 켜짐
            녹음 버튼 눌렀을 때 아이콘 변화, 녹음 버튼 끄면 녹음 저장
            녹음을 여러번 할 수도 있으니까 여러번 누적 저장도 고려해야힘
            회의록 작성 완료 누를 때 녹음본을 저장하시겠습니까? 팝업창 띄워줌
            회의록 내용 작성할 칸 (아래 요약본 파트 따로 나누는 건 api 쪽 css 수정이 필요해보임 - 기본 템플릿처럼 제공하는 기능)
            내용 작성 시 회의 제목, 참여자, (날짜는 달력에서 클릭했던 날짜로), 사진 첨부 등이 가능하게?, 요약본에는 그 글 앞에 점 찍혀있는 그거 만들어주기
            작성 완료 버튼
            내용 작성 부분은 백 쪽 api 불러올 걸 고려해서 코드 작성*/}
        <div className ="MeetingLog">
          <button className="record-button" onClick={handleRecordButtonClick}>
            {isRecording ? (
              <IoRecordingOutline size={24} />
            ) : (
              <IoMicSharp size={24} />
            )}
            {isRecording ? "녹음 중" : "녹음하기"}
          </button>
          <div className="meeting-contents">
            <input  className ="titleinput" type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="회의 제목을 입력하세요"
            />
            <div>
              <ParticipantSelector
                participants={participants}
                onSave={saveParticipantsToDB}
              />
            </div>
            <div>{realTimeData}</div>
            <textarea 
              value={realTimeText}
              onChange={(e) => setRealTimeText(e.target.value)}
              placeholder = "회의 내용을 입력하세요"
              />
          </div>
          <div>
            {recordedFiles.map((file, index) => (
              <div key={index}>{file}</div>
            ))}
          </div>
          <button className="end-button" onClick={() => { handleEndButtonClick(); handleSubmitToDB(); }}>작성 완료</button>
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