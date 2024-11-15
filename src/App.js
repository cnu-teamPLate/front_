import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { io } from 'socket.io-client';
import Home from './pages/Home/Home';
import Login from './components/Login/Login';
import SignUp from './components/SignUp/SignUp';
import Dashboard from './pages/Dashboard/Dashboard';
import Assignment from './pages/Assignment/Assignment';
import AssignmentDetail from './pages/AssignmentDetail/AssignmentDetail';
import MeetingLog from './pages/MeetingLog/MeetingLog';
import MeetingLogView from './pages/MeetingLogView/MeetingLogView';
import ProjectDetail from './pages/project/project';
import MyPage from './components/MyPage/MyPage';
import Schedule from './components/schedule/schedule';
import FileUploadPage from './pages/FileUpload/FileUploadPage';
import './style/variables.css';
import './App.css';

const socket = io('http://localhost:3001'); // 백엔드 WebSocket 서버 주소

function App() {
  const notifications = [
    { nickname: '닉네임', comment: '새 댓글' },
    { nickname: '닉네임', comment: '다른 댓글' }
  ];

  const handleFormSubmit = (formData) => {
    console.log('Form submitted:', formData);
  };

  useEffect(() => {
    // WebSocket 연결 이벤트
    socket.on('connect', () => {
      console.log('Connected to WebSocket server:', socket.id);
    });

    // WebSocket 연결 해제 이벤트
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socket.disconnect(); // 컴포넌트 언마운트 시 WebSocket 연결 해제
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route
            path="/Assignment"
            element={
              <Assignment
                onSubmit={handleFormSubmit}
                currentUser="1"
                notifications={notifications}
              />
            }
          />
          <Route path="/AssignmentDetail" element={<AssignmentDetail />} />
          <Route path="/project-detail" element={<ProjectDetail />} />
          <Route path="/FileUpload" element={<FileUploadPage />} />
          <Route path="/MeetingLog" element={<MeetingLog socket={socket} />} />
          <Route path="/MeetingLogView" element={<MeetingLogView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
