import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './components/Login/Login';
import SignUp from './components/SignUp/SignUp';
import Dashboard from './pages/Dashboard/Dashboard';
import Assignment from './pages/Assignment/Assignment';
import AssignmentDetail from './pages/AssignmentDetail/AssignmentDetail';
import ProjectDetail from './pages/project/project';
import MyPage from './components/MyPage/MyPage';
import Schedule from './components/schedule/schedule';
import './App.css';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route 
            path="/Assignment" 
            element={<Assignment onSubmit={handleFormSubmit} currentUser="1" notifications={notifications}/>} 
          />
          <Route path="/AssignmentDetail" element={<AssignmentDetail />} />
          <Route path="/project-detail" element={<ProjectDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
