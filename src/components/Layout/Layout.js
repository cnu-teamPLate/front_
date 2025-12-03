import React, { useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../SideBar/SideBar';
import './Layout.css';

// small helper to join class names without external dependency
const cls = (...args) => args.filter(Boolean).join(' ');

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    return (
        <div className={cls("layout", sidebarOpen && "sidebar-open")}>
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar sidebarOpen={sidebarOpen} />

            {/* flex로 가운데(main) 늘리고 footer는 항상 맨 아래 */}
            <main className={cls("content", sidebarOpen && "sidebar-open")}>
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default Layout;
