import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import Dashboard from './pages/Dashboard/Dashboard';
import Assignment from './pages/Assignment/Assignment';
import AssignmentDetail from './pages/AssignmentDetail/AssignmentDetail';
import MeetingLog from './pages/MeetingLog/MeetingLog';
import MeetingLogView from './pages/MeetingLogView/MeetingLogView';
import ProjectDetail from './pages/project/project';
import MyPage from './pages/MyPage/MyPage';
import Schedule from './pages/schedule/schedule';
import FileUploadPage from './pages/FileUpload/FileUploadPage';
import Header from './components/Header';
import Footer from './components/Footer';

import './App.css';
import './style/variables.css';

function App() {
  const notifications = [
    { nickname: '닉네임', comment: '새 댓글' },
    { nickname: '닉네임', comment: '다른 댓글' }
  ];

  const handleFormSubmit = (formData) => {
    console.log('Form submitted:', formData);
  };


  return (
    <Router>
      <div className="App">

      <Header />
        <main>
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
            <Route path="/MeetingLog" element={<MeetingLog />} />
            <Route path="/MeetingLogView" element={<MeetingLogView />} />
          </Routes>
        
        </main>
        <Footer />
        </div>
    </Router>
  );
}

export default App;
