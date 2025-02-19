import React from 'react';
import './SideBar.css';

const SideBar = ({ sidebarOpen, toggleSidebar }) => {
    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <button className="close-btn" onClick={toggleSidebar}>✖</button>
            <h2>📌 Sidebar</h2>
            <ul className="sidebar-menu">
                <li>🏠 홈</li>
                <li>📅 일정</li>
                <li>📝 할 일</li>
                <li>⚙ 설정</li>
            </ul>
        </aside>
    );
};

export default SideBar;
