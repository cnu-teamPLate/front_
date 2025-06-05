import React, { useState, useEffect } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../SideBar/SideBar';
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showFooter, setShowFooter] = useState(false); // 푸터 보임 여부 상태

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
        console.log(`사이드바 상태 변경됨: ${!sidebarOpen ? "열림" : "닫힘"}`);
    };

    useEffect(() => {
        console.log(`🖥️ 메인 콘텐츠 업데이트 - 사이드바 상태: ${sidebarOpen ? "열림" : "닫힘"}`);
    }, [sidebarOpen]);

    // 스크롤 핸들러: 맨 아래 도달 여부를 감지
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const fullHeight = document.documentElement.scrollHeight;

            // 스크롤 위치 + 뷰포트 높이가 문서 전체 높이 이상이면 맨 아래에 도달한 것으로 간주
            if (scrollTop + windowHeight >= fullHeight) {
                setShowFooter(true);
            } else {
                setShowFooter(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // 초기 한 번 체크
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className={`layout ${sidebarOpen ? "sidebar-open" : ""}`}>
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar sidebarOpen={sidebarOpen} />

            <main className={`content ${sidebarOpen ? 'sidebar-open' : ''}`}>
                {children}
            </main>

            {showFooter && <Footer />}
        </div>
    );
};

export default Layout;
