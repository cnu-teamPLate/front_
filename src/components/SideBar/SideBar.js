import React from 'react';
import './SideBar.css';
import MyCalendar from '../Calendar/Calendar';

const SideBar = ({ sidebarOpen, toggleSidebar }) => {
    
    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <button className="close-btn" onClick={toggleSidebar}>✖</button>
            <div className="calendar-container">
                <div className="calendar-wrapper">
                    <MyCalendar />
                </div>
            </div>
        </aside>
    );
};

export default SideBar;
