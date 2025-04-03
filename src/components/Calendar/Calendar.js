import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // 기본 스타일
import './Calendar.css';
const MyCalendar = () => {
    const [value, setValue] = useState(new Date());

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px', marginBottom: '33px' }}>Calendar</h2>
            <Calendar
                onChange={setValue}
                value={value}
                minDetail="year"
                maxDetail="month"
                showNeighboringMonth={true}
                formatDay={(locale, date) => date.getDate().toString()}
            />
        </div>
    );
};

export default MyCalendar;
