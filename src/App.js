import React, { useEffect, useState } from 'react';
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
import AvailabilityMatrix from './pages/schedule/AvailabilityMatrix';
import DatePickerGrid from './pages/schedule/DatePickerGrid';
import dummyEvents from './pages/schedule/dummyData';
import TimeSelectionGrid from './pages/schedule/TimeSelectionGrid';
import FileUploadPage from './pages/FileUpload/FileUploadPage';
import Layout from './components/Layout/Layout';
import Footer from './components/Footer';//사이드바가 필요없는 페이지에 필요함
import Header from './components/Header';
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
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          }
        />
        <Route path="/login" element={
          <>
            <Header />
            <div style={{ margin: "150px 0" }}> {/* 위아래 간격 추가 */}
              <Login />
            </div>
            <Footer />
          </>
        } />
        <Route path="/signup" element={
          <>
            <Header />
            <div style={{ margin: "100px 0" }}> {/* 위아래 간격 추가 */}

              <SignUp />
            </div>

            <Footer />
          </>
        }
        />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/mypage" element={<Layout><MyPage /></Layout>} />
        <Route path="/schedule" element={<Layout><Schedule /></Layout>} />
        <Route path="/Availability" element={<Layout><AvailabilityMatrix /></Layout>} />
        <Route path="/DatePickerGrid" element={<Layout><DatePickerGrid /></Layout>} />
        <Route path="/dummyData" element={<Layout><dummyData /></Layout>} />
        <Route path="/TimeSelectionGrid" element={<Layout><TimeSelectionGrid /></Layout>} />

        <Route
          path="/Assignment"
          element={
            <Layout>
              <Assignment onSubmit={handleFormSubmit} currentUser="1" notifications={notifications} />
            </Layout>
          }
        />
        <Route path="/AssignmentDetail" element={<Layout><AssignmentDetail /></Layout>} />
        <Route path="/project-detail" element={<Layout><ProjectDetail /></Layout>} />
        <Route path="/FileUpload" element={<Layout><FileUploadPage /></Layout>} />
        <Route path="/MeetingLog" element={<Layout><MeetingLog /></Layout>} />
        <Route path="/MeetingLogView" element={<Layout><MeetingLogView /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
