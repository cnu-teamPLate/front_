import React from 'react';
import './SideBar.css';
import MyCalendar from '../Calendar/Calendar';

const SideBar = ({ sidebarOpen }) => {
    console.log(`📌 사이드바 상태: ${sidebarOpen ? "열림" : "닫힘"}`);

    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="calendar-container">
                <div className="calendar-wrapper">
                    <MyCalendar />
                </div>
            </div>
        </aside>
    );
};

export default SideBar;
