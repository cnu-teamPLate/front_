import React, { useState, useEffect } from 'react';
import { IoMenu, IoPerson } from "react-icons/io5";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';

const localizer = momentLocalizer(moment);

const Schedule = () => {
    const [events, setEvents] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: '',
        end: '',
        location: '',
        attendees: '',
        agenda: ''
    });
    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popupContent, setPopupContent] = useState('');
    const [popupStyle, setPopupStyle] = useState({ display: 'none', top: 0, left: 0 });
    const [whenToMeet, setWhenToMeet] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCreateEvent = () => {
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    const handleWhenToMeet = () => {
        setWhenToMeet(true);
    };

    const handleAddEvent = (eventObject) => {
        setEvents([...events, eventObject]);
    };

    const handleSelectSlot = ({ start, end }) => {
        const newEventObject = {
            title: 'Scheduled Event', // 기본 이벤트 이름
            start: start,
            end: end,
            location: '',
            attendees: '',
            agenda: ''
        };

        // Personal Schedule에 바로 저장
        handleAddEvent(newEventObject);

        // Group Schedule에도 동일한 이벤트를 추가하여 연동
        handleAddEvent(newEventObject);
    };

    const handleMonthVersion = () => {
        setView('month'); // 월간 보기로 변경
    };

    const handleWeekVersion = () => {
        setView('week'); // 주간 보기로 변경
    };

    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToToday = () => {
            toolbar.onNavigate('TODAY');
        };

        return (
            <div className="rbc-toolbar">
                <span className="rbc-btn-group">
                    <button type="button" onClick={goToToday}>Today</button>
                    <button type="button" onClick={goToBack}><FaAngleLeft /></button>
                    <span className="rbc-toolbar-label">{toolbar.label}</span>
                    <button type="button" onClick={goToNext}><FaAngleRight /></button>
                </span>
            </div>
        );
    };

    const handleWheel = (e) => {
        if (e.deltaY < 0) {
            setCurrentDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() - 1)));
        } else {
            setCurrentDate(prevDate => new Date(prevDate.setDate(prevDate.getDate() + 1)));
        }
    };

    const handleEventMouseOver = (event, e) => {
        setPopupContent(
            `<div><strong>${event.title}</strong></div>
             <div>시간: ${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}</div>
             <div>장소: ${event.location}</div>
             <div>대상: ${event.attendees}</div>
             <div>안건:</div>
             <ul>
                ${event.agenda.split('\n').map((item, idx) => `<li key=${idx}>${item}</li>`).join('')}
             </ul>`
        );
        setPopupStyle({
            display: 'block',
            top: e.clientY + 10 + 'px',
            left: e.clientX + 10 + 'px'
        });
    };

    const handleEventMouseOut = () => {
        setPopupStyle({ display: 'none' });
    };

    useEffect(() => {
        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return (
        <div className="Dashboard">
            <header className="Dashboard-header">
                <div className="my-page-logout">
                    <IoPerson size={24} />
                    <a href="/mypage">마이페이지</a> | <a href="/logout">로그아웃</a>
                </div>
            </header>
            <button className="sidebar-toggle" onClick={toggleSidebar}>
                <IoMenu size={24} />
            </button>

            <main className={`App-content ${sidebarOpen ? 'shifted' : ''}`}>
            </main>

            {showPopup && (
                <>
                    <div className="popup-backdrop" onClick={handleClosePopup}></div> {/* 팝업 외부 클릭 시 닫기 */}
                    <div className="popup">
                        <div className="popup-inner">
                            <h2>일정 생성</h2>
                            <label>시작 시간:</label>
                            <input
                                type="datetime-local"
                                value={newEvent.start}
                                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                            />
                            <label>종료 시간:</label>
                            <input
                                type="datetime-local"
                                value={newEvent.end}
                                onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                            />
                            <label>장소:</label>
                            <input
                                type="text"
                                value={newEvent.location}
                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                            />
                            <label>참석자:</label>
                            <input
                                type="text"
                                value={newEvent.attendees}
                                onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                            />
                            <label>안건:</label>
                            <textarea
                                value={newEvent.agenda}
                                onChange={(e) => setNewEvent({ ...newEvent, agenda: e.target.value })}
                            />
                            <button onClick={() => handleAddEvent(newEvent)} className="add-event-button">일정 추가</button>
                            <button onClick={handleClosePopup} className="cancel-button">취소</button>
                        </div>
                    </div>
                </>
            )}

            <div
                className="event-popup"
                style={popupStyle}
                dangerouslySetInnerHTML={{ __html: popupContent }}
            />
            <div className="calender-container">
                <button className="create-schedule-button" onClick={handleCreateEvent}>
                    일정 생성하기
                </button>
                <button className="month-version-button" onClick={handleMonthVersion}>
                    월별 일정보기
                </button>
                <button className="week-version-button" onClick={handleWeekVersion}>
                    주간 일정보기
                </button>
                <button className="when-to-meet-button" onClick={handleWhenToMeet}>
                    시간 맞추기
                </button>
                {!whenToMeet ? (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        date={currentDate}
                        view={view}
                        onView={(view) => setView(view)}
                        onNavigate={(date) => setCurrentDate(date)}
                        components={{
                            toolbar: CustomToolbar
                        }}
                        onSelectEvent={(event, e) => handleEventMouseOver(event, e)}
                        onMouseOut={handleEventMouseOut}
                    />
                ) : (
                    <div className="whentomeet-calendars">
                        <button className="add-my-event" onClick={() => handleAddEvent(newEvent)}>
                            내 일정 입력하기
                        </button>
                        <div className="when-to-meet-calendars">
                            <div className="calendar">
                                <h3>Group Schedule</h3>
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: 500 }}
                                    date={currentDate}
                                    view="week"
                                    onSelectSlot={handleSelectSlot}  // 선택된 시간을 처리하는 함수
                                    selectable={true}  // 선택 가능하게 설정
                                    onNavigate={(date) => setCurrentDate(date)}
                                    components={{
                                        toolbar: CustomToolbar
                                    }}
                                    onSelectEvent={(event, e) => handleEventMouseOver(event, e)}
                                    onMouseOut={handleEventMouseOut}
                                />
                            </div>
                            <div className="calendar">
                                <h3>Personal Schedule</h3>
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: 500 }}
                                    date={currentDate}
                                    view="week"
                                    selectable={true}  // 드래그로 선택 가능하게 설정
                                    onSelectSlot={handleSelectSlot}  // 선택된 시간을 처리하는 함수
                                    onNavigate={(date) => setCurrentDate(date)}
                                    components={{
                                        toolbar: CustomToolbar
                                    }}
                                    onSelectEvent={(event, e) => handleEventMouseOver(event, e)}
                                    onMouseOut={handleEventMouseOut}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer>
                <p>© 2024 CNU </p>
                <div className="footer-links">
                    <a href="/about">About Us</a> | <a href="/contact">Contact</a> | <a href="/privacy">Privacy Policy</a>
                </div>
            </footer>
        </div>
    );
};

export default Schedule;