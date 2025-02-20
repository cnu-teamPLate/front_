import React, { useState, useEffect } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../SideBar/SideBar';
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => {
            const newState = !prev;
            console.log(`🔄 사이드바 상태 변경됨: ${newState ? "열림" : "닫힘"}`);
            return newState;
        });
    };

    // ✅ 사이드바 상태 변경 시에만 콘솔 출력
    useEffect(() => {
        console.log(`🖥️ 메인 콘텐츠 업데이트 - 사이드바 상태: ${sidebarOpen ? "열림" : "닫힘"}`);
    }, [sidebarOpen]);

    return (
        <div className={`layout ${sidebarOpen ? "sidebar-open" : ""}`}> 
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar sidebarOpen={sidebarOpen} />
            
            {/* ✅ 사이드바가 열릴 때 main 태그에도 sidebar-open 클래스 적용 */}
            <main className={`content ${sidebarOpen ? 'sidebar-open' : ''}`}>
                {children}
            </main>

            <Footer />
        </div>
    );
};export default Layout;
