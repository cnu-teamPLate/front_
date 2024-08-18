import React from 'react';
import { Link } from 'react-router-dom';
import { IoPerson } from "react-icons/io5";
import './Home.css';

function Home() {
  return (
    <div className="Home">
      <header className="App-header">
        <div className="login-signup">
          <IoPerson size={24} />
          <Link to="/login">로그인</Link> | <Link to="/signup">회원가입</Link>
        </div>
      </header>
      <main className="App-content">
        <section className="hero">
          <div className="hero-text">
            <h1>팀 프로젝트 관리 서비스</h1>
            <p>쉬운 진행 상황 체크, 목표 상기</p>
            <button className="cta-button">지금 시작하기</button>
          </div>
        </section>
        <section className="features">
          <h2>주요 기능</h2>
          <div className="feature-list">
            <div className="feature-item">
              <img src="feature1.png" alt="feature1" />
              <h3>과제별 기여도 측정</h3>
              <p>전체, 월별, 주별 기여도를 자동으로 제공</p>
            </div>
            <div className="feature-item">
              <img src="feature2.png" alt="feature2" />
              <h3>역할, 업무 분담</h3>
              <p>과제별, 인원별 명확한 업무 분담, 정리</p>
              <p>해야하는 활동에 대한 가이드라인 제시</p>
            </div>
            <div className="feature-item">
              <img src="feature3.png" alt="feature3" />
              <h3>회의 시간 정하기</h3>
              <p>가능한 시간대를 직접 고를 수 있는 편리한 서비스</p>
            </div>
          </div>
        </section>
        <section className="how-it-works">
          <h2>서비스 이용 방법</h2>
          <p>학번으로 팀원을 간편하게 초대해고, 일정과 목표 상기를 통한 편리한 프로젝트 관리</p>
        </section>
        <section className="testimonials">
          <h2>사용자 후기</h2>
          <div className="testimonial-list">
            <div className="testimonial-item">
              <p>"이 서비스 덕분에 프로젝트 관리가 정말 쉬워졌어요!"</p>
              <p>- 사용자 1</p>
            </div>
            <div className="testimonial-item">
              <p>"프로젝트 목표를 달성하는 데 큰 도움이 되었습니다."</p>
              <p>- 사용자 2</p>
            </div>
          </div>
        </section>
        <section className="faq">
          <h2>자주 묻는 질문</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>질문 1</h3>
              <p>질문 1에 대한 답변</p>
            </div>
            <div className="faq-item">
              <h3>질문 2</h3>
              <p>질문 2에 대한 답변</p>
            </div>
          </div>
        </section>
        <footer>
          <p>© 2024 CNU </p>
          <div className="footer-links">
            <a href="/about">About Us</a> | <a href="/contact">Contact</a> | <a href="/privacy">Privacy Policy</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Home;