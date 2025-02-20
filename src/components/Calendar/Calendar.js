import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // 기본 스타일
import './Calendar.css';
const MyCalendar = () => {
    const [value, setValue] = useState(new Date());

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',marginTop:'8px',marginBottom:'33px' }}>Calendar</h2>
            <Calendar
                onChange={setValue}
                value={value}
                minDetail="year" // '연도'부터 보이게 조정
                maxDetail="month" // 월 기준으로만 보이도록 설정
                showNeighboringMonth={true} // 이전, 다음 달 일부 날짜 보이도록 조정
            />
        </div>
    );
};

export default MyCalendar;
