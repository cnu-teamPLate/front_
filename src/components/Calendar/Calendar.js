import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ko';  // 한국어 로케일 추가
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 한국어 설정
moment.locale('ko');

// localizer를 컴포넌트 외부에서 정의
const localizer = momentLocalizer(moment);

const MyCalendar = ({ events = [] }) => {
    return (
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor={(event) => new Date(event.date)}
            endAccessor={(event) => {
                const date = new Date(event.date);
                date.setHours(date.getHours() + 1);
                return date;
            }}
            style={{ height: 500 }}
            views={['month', 'week', 'day']}
            defaultView="month"
            formats={{
                monthHeaderFormat: 'YYYY년 MM월',
                dayHeaderFormat: 'MM월 DD일 dddd',
                dayRangeHeaderFormat: ({ start, end }) =>
                    `${moment(start).format('YYYY년 MM월 DD일')} - ${moment(end).format('MM월 DD일')}`
            }}
            messages={{
                today: '오늘',
                previous: '이전',
                next: '다음',
                month: '월',
                week: '주',
                day: '일',
                agenda: '일정'
            }}
            onSelectEvent={event => {
                console.log('선택된 이벤트:', event);
            }}
        />
    );
};

export default MyCalendar;