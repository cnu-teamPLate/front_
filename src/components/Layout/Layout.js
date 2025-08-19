import React, { useState } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from '../SideBar/SideBar';
import classNames from "classnames";
import './Layout.css';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    return (
        <div className={classNames("layout", { "sidebar-open": sidebarOpen })}>
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar sidebarOpen={sidebarOpen} />

            {/* flex로 가운데(main) 늘리고 footer는 항상 맨 아래 */}
            <main className={classNames("content", { "sidebar-open": sidebarOpen })}>
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default Layout;
