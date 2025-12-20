import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Footer from '../../components/Footer'; // 경로가 맞는지 확인해주세요

function Home() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="Home">
      <section className="hero">
        <div className="hero-text">
          <h1>성공적인 팀플의 시작, TeamPlate</h1>
          <p>복잡한 팀 프로젝트, 일정부터 기여도 관리까지 한 번에 해결하세요.</p>
          <button className="cta-button" onClick={handleLogin}>
            무료로 시작하기
          </button>
        </div>
      </section>

      <section className="features">
        <h2>주요 기능</h2>
        <div className="feature-list">
          <div className="feature-item">
            {/* 이미지가 public 폴더에 있어야 합니다 */}
            <img src="feature1.png" alt="기여도 분석 그래프" />
            <h3>투명한 기여도 측정</h3>
            <p>월별, 주별 개인 기여도를 시각화된 그래프로 한눈에 확인하세요.</p>
          </div>
          <div className="feature-item">
            <img src="feature2.png" alt="업무 분담 가이드" />
            <h3>명확한 역할 분담</h3>
            <p>팀원별 역할과 할 일을 체계적으로 정리하고 가이드라인을 제공합니다.</p>
          </div>
          <div className="feature-item">
            <img src="feature3.png" alt="회의 시간 조율" />
            <h3>간편한 회의 시간 조율</h3>
            <p>팀원들이 가능한 시간을 입력하면 최적의 회의 시간을 자동으로 찾아줍니다.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>서비스 이용 방법</h2>
        <p>프로젝트 생성 후 학번으로 팀원을 초대하고, 체계적인 협업을 경험해보세요.</p>
      </section>

      <section className="testimonials">
        <h2>사용자 후기</h2>
        <div className="testimonial-list">
          <div className="testimonial-item">
            <p>"매번 회의 시간 잡는 게 전쟁이었는데, 이 서비스 덕분에 5분 만에 정했어요. 팀플 스트레스가 절반으로 줄었습니다!"</p>
            <p className="author">- 컴퓨터공학과 김철수님</p>
          </div>
          <div className="testimonial-item">
            <p>"내 기여도가 그래프로 보이니까 더 열심히 하게 되더라고요. 무임승차 없는 클린한 팀플이 가능해졌습니다."</p>
            <p className="author">- 경영학과 이영희님</p>
          </div>
        </div>
      </section>

      <section className="faq">
        <h2>자주 묻는 질문 (FAQ)</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3>Q. 서비스 이용료는 무료인가요?</h3>
            <p>A. 네, 대학생들의 원활한 팀 프로젝트를 위해 모든 기능이 무료로 제공됩니다.</p>
          </div>
          <div className="faq-item">
            <h3>Q. 팀원은 어떻게 초대하나요?</h3>
            <p>A. 프로젝트 생성 후 팀원의 '학번'을 입력하여 간편하게 초대할 수 있습니다. 초대받은 팀원은 로그인 후 즉시 프로젝트에 참여 가능합니다.</p>
          </div>
          <div className="faq-item">
            <h3>Q. 파일 업로드 용량 제한이 있나요?</h3>
            <p>A. 회의록 녹음 파일 및 과제 제출을 위한 넉넉한 저장 공간을 제공하고 있습니다. (지원 형식: pdf, docs, wav 등)</p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

export default Home;