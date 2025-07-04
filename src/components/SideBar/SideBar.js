import React from 'react';
import './SideBar.css';
import MyCalendar from '../Calendar/Calendar';
import MyAssignments from '../MyAssignments/MyAssignments';

const SideBar = ({ sidebarOpen }) => {
    console.log(`📌 사이드바 상태: ${sidebarOpen ? "열림" : "닫힘"}`);

    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="calendar-container">
                <div className="calendar-wrapper">
                    <MyCalendar />
                </div>
            </div>
            {/* 기존 todo-list/todolist wrapper div 제거, MyAssignments만 남김 */}
            <MyAssignments isSidebar={true} />
        </aside>
    );
};

export default SideBar;
