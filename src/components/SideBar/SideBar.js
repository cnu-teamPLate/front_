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
            <div className='todo-list container'>
                <div className='todolist wrapper'>
                    <MyAssignments isSidebar={true} />
                </div>
            </div>
        </aside>
    );
};

export default SideBar;
