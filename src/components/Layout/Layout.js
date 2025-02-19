import React, { useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../SideBar/SideBar';
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="layout">
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            {/* ✅ 콘텐츠 이동 코드 제거 */}
            <main className="content">{children}</main>
            <Footer />
        </div>
    );
};

export default Layout;
