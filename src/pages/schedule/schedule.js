import { useNavigate, Link, useLocation } from "react-router-dom";
import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';
import MyCalendar from '../../components/Calendar/Calendar';
import WhenToMeetGrid, { AvailabilityMatrix, TimeSelectionGrid } from "./when2meet";
// 파일 맨 위쪽
const API = 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080';
// --- state 선언들 바로 아래 ---
// 파일 상단 (컴포넌트 밖) — Hook 대신 즉시 변환
const ProjectSidebar = ({ projectId }) => {
    const userId = localStorage.getItem('userId');
    const sidebarLinks = [
        { path: `/assignment?projectId=${projectId}&userId=${userId}`, label: '과제' },
        { path: `/schedule?projectId=${projectId}&userId=${userId}`, label: '프로젝트 일정' },
        { path: `/project/${projectId}/MeetingLog`, label: '회의록' },
        { path: `/project/${projectId}/FileUpload`, label: '자료 업로드' },
    ];

    return (
        <aside className="project-sidebar">
            <nav>
                <ul>
                    {sidebarLinks.map(link => (
                        <li key={link.path}>
                            <Link to={link.path}>{link.label}</Link>
                        </li>
                    ))}
                </ul>
                <hr />
                <ul>
                    <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer">깃허브 바로가기</a></li>
                    <li><Link to="/useful-sites">팀플 유용 사이트</Link></li>
                    <li><Link to="/experiences">경험담 보기</Link></li>
                    <li><Link to="/meeting-rooms">우리 학교 회의실</Link></li>
                </ul>
            </nav>
        </aside>
    );
};


/** 함수 선언식(hoisting O) */
function buildDetails(events) {
    const obj = {};
    events.forEach(({ date, startTime, endTime, username }) => {
        if (!obj[date]) obj[date] = [];
        obj[date].push({ startTime: moment(startTime, 'H:mm:ss').format('HH:mm:ss'), endTime: moment(endTime, 'H:mm:ss').format('HH:mm:ss'), username });
    });
    return obj;
}
const userInfo = {
    "20211079": "Alice",
    "20211080": "Bob"
};

function DatePickerGrid({
    currentYear,
    currentMonth,
    onSelectDate,
    selectedDates,
    onMouseDownDay,
    onMouseEnterDay,
    onMouseUp
}) {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();

    const calendarCells = [];
    for (let i = 0; i < startDay; i++) calendarCells.push(null);
    for (let day = 1; day <= daysInMonth; day++) calendarCells.push(day);

    const pad = (n) => String(n).padStart(2, '0');

    return (
        <div className="date-picker-grid" onMouseUp={onMouseUp}>
            <div className="month-label">
                {currentYear}년 {currentMonth + 1}월
            </div>

            <div className="weekdays">
                <div>Sun</div><div>Mon</div><div>Tue</div>
                <div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div className="days">
                {calendarCells.map((cell, index) => {
                    if (cell === null) return <div key={index} className="day-cell empty" />;

                    const dateKey = `${currentYear}-${pad(currentMonth + 1)}-${pad(cell)}`; // YYYY-MM-DD
                    const isSelected = selectedDates.includes(dateKey);

                    return (
                        <div
                            key={index}
                            className={`day-cell ${isSelected ? 'selected' : ''}`}
                            onMouseDown={(e) => {
                                e.preventDefault(); // 텍스트 선택 방지
                                if (onMouseDownDay) onMouseDownDay(dateKey);
                                else onSelectDate?.(dateKey); // 드래그 미사용 시 클릭 토글
                            }}
                            onMouseEnter={() => onMouseEnterDay?.(dateKey)}
                        >
                            {cell}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function addMonths(date, n) {
    return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function TwoMonthPicker({ selectedDates, onSelectDate }) {
    const today = new Date();
    const [baseDate, setBaseDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const nextDate = addMonths(baseDate, 1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragToSelect, setDragToSelect] = useState(true); // 드래그로 '선택'할지 '해제'할지

    // onSelectDate는 토글이라서, 원하는 상태(선택/해제)로 '맞추기'
    const ensureState = (dateKey, shouldSelect) => {
        const has = selectedDates.includes(dateKey);
        if (shouldSelect && !has) onSelectDate(dateKey);
        if (!shouldSelect && has) onSelectDate(dateKey);
    };

    const handleMouseDownDay = (dateKey) => {
        const already = selectedDates.includes(dateKey);
        const target = !already;             // 클릭 시 반대로
        setDragToSelect(target);
        setIsDragging(true);
        ensureState(dateKey, target);        // 첫 칸 즉시 반영
    };

    const handleMouseEnterDay = (dateKey) => {
        if (!isDragging) return;
        ensureState(dateKey, dragToSelect);  // 드래그 중엔 모두 동일 상태로
    };

    const handleMouseUp = () => setIsDragging(false);

    // 캘린더 바깥에서 마우스 떼어도 드래그 종료
    useEffect(() => {
        const up = () => setIsDragging(false);
        window.addEventListener('mouseup', up);
        return () => window.removeEventListener('mouseup', up);
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" onClick={() => setBaseDate(addMonths(baseDate, -1))}>이전</button>
                <button type="button" onClick={() => setBaseDate(addMonths(baseDate, 1))}>다음</button>
            </div>

            <div style={{ display: 'flex', gap: 16, userSelect: 'none' }}>
                <DatePickerGrid
                    currentYear={baseDate.getFullYear()}
                    currentMonth={baseDate.getMonth()}
                    selectedDates={selectedDates}
                    onSelectDate={onSelectDate}            // 그대로 전달(단일 클릭 토글에도 쓰임)
                    onMouseDownDay={handleMouseDownDay}    // ⬅ 추가
                    onMouseEnterDay={handleMouseEnterDay}  // ⬅ 추가
                    onMouseUp={handleMouseUp}              // ⬅ 추가
                />
                <DatePickerGrid
                    currentYear={nextDate.getFullYear()}
                    currentMonth={nextDate.getMonth()}
                    selectedDates={selectedDates}
                    onSelectDate={onSelectDate}
                    onMouseDownDay={handleMouseDownDay}
                    onMouseEnterDay={handleMouseEnterDay}
                    onMouseUp={handleMouseUp}
                />
            </div>
        </div>
    );
}


const EventComponent = ({ event }) => {
    const user = userInfo[event.userId];
    return (
        <div
            style={{
                borderRadius: '5px',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                color: '#fff',
                fontSize: '0.85em'
            }}
        >
            <span>{event.title}</span>
        </div>
    );
};

const localizer = momentLocalizer(moment);

/* 6) Schedule 메인 컴포넌트 */
const Schedule = () => {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const currentProject = urlParams.get("projectId");
    const currentUser = localStorage.getItem("userId");
    const [view, setView] = useState('month');

    const handleMonthVersion = () => {
        setView('month');
    };

    const handleWeekVersion = () => {
        setView('week');
    };

    const handleDayVersion = () => {
        setView('day');
    };
    const [events, setEvents] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    // newEvent의 초기 상태 설정 부분
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: moment().format('YYYY-MM-DDTHH:mm'), // 현재 날짜/시간으로 초기화
        end: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
        location: '',
        attendees: '',
        agenda: '',
        category: 'plan'
    });
    const [whenToMeet, setWhenToMeet] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popupContent, setPopupContent] = useState('');
    const [popupStyle, setPopupStyle] = useState({ display: 'none', top: 0, left: 0 });


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


    const handleSelectSlot = ({ start, end }) => {
        const userId = currentUser.id;
        const projId = currentProject.id;
        const startDate = new Date(start);
        const endDate = new Date(end);

        const existing = events.find(
            event =>
                event.userId === userId &&
                event.projId === projId &&
                new Date(event.start).getTime() === startDate.getTime() &&
                new Date(event.end).getTime() === endDate.getTime()
        );

        if (existing) {
            setEvents(events.filter(event => event !== existing));
        } else {
            const newEventObject = {
                title: 'Available',
                start,
                end,
                userId,
                projId,
            };
            setEvents([...events, newEventObject]);
        }
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

    const handleEventMouseOver = (event, e) => {
        setPopupContent(
            `<div><strong>${event.title}</strong></div>
       <div>시간: ${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}</div>
       <div>장소: ${event.location}</div>
       <div>대상: ${event.attendees}</div>
       <div>카테고리: ${event.category}</div>
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
    const [availability, setAvailability] = useState([]);
    const handleEventMouseOut = () => {
        setPopupStyle({ display: 'none' });
    };

    // onExit 함수는 WhenToMeetGrid에서 onExit prop으로 전달됨
    const exitWhenToMeet = () => {
        setWhenToMeet(false);
    };
    // 일정 생성 API 연결
    const handleAddEvent = async (eventObject) => {
        const userId = currentUser;
        const projId = currentProject;

        // 날짜가 없으면 경고
        if (!eventObject.start) {
            alert('날짜를 선택해주세요.');
            return;
        }

        // LocalDateTime 형식으로 날짜 변환 (YYYY-MM-DDTHH:mm:ss)
        const formattedDate = moment(eventObject.start).format('YYYY-MM-DDTHH:mm:ss');

        // 서버 요구사항에 맞게 데이터 구조화
        const newEvent = {
            projId: projId,
            date: formattedDate,  // LocalDateTime 형식으로 변경
            scheName: eventObject.title || '새 일정',
            place: eventObject.location || '',
            category: eventObject.category || 'plan',
            detail: eventObject.agenda || '',
            participants: eventObject.attendees ?
                eventObject.attendees.split(',').map(p => p.trim()) :
                []
        };

        console.log('서버로 전송되는 데이터:', newEvent); // 디버깅용

        try {
            const response = await fetch(`${API}/schedule/check/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEvent)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '일정 생성에 실패했습니다.');
            }

            console.log('생성된 일정:', data);
            setEvents(prevEvents => [...prevEvents, data]);
            setShowPopup(false);
            alert('일정이 성공적으로 생성되었습니다.');

        } catch (error) {
            console.error("일정 생성 실패:", error);
            alert(`일정 생성에 실패했습니다. (${error.message})`);
        }
    };
    // 팝업의 카테고리 선택 부분 수정 (textarea 제거하고 select만 사용)
    const [loading, setLoading] = useState(false);
    // 일정 조회 (주간)
    useEffect(() => {
        fetchEvents();
        fetchAvailability();
    }, [view]);


    const fetchEvents = async () => {
        setLoading(true);
        try {
            const apiUrl = view === 'month'
                ? 'http://ec2-3-34-144-232.ap-northeast-2.compute.amazonaws.com:8080/schedule/check/monthly'
                : 'http://ec2-3-34-144-232.ap-northeast-2.compute.amazonaws.com:8080/schedule/check/weekly';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projId: "cse00001",
                    date: "2025-01-01T00:02:27.Z",
                    cate: "meeting"
                }),
            });
            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Event API 응답 데이터:", data);

            if (data.teamSchedules?.cse00001) {
                setEvents(data.teamSchedules.cse00001);
            } else {
                setEvents([]);
                console.warn("일정을 불러올 수 없습니다.");
            }
        } catch (error) {
            console.error("API 호출 중 오류:", error.message);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };
    const fetchAvailability = async (id) => {
        try {
            const url = `${API}/schedule/meeting/adjust/availability?when2meetId=${id}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && typeof data === 'object') {
                setAvailability(data.details || data);   // 필요에 따라 수정
            } else {
                setAvailability([]);
            }
        } catch (e) {
            console.error('가용 시간 조회 실패', e);
            setAvailability([]);
        }
    };

    return (
        <div className="board">
            <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div>
                    <MyCalendar />
                </div>
            </aside>

            {showPopup && (
                <>
                    <div className="popup-backdrop" onClick={handleClosePopup}></div>
                    <div className="popup">
                        <div className="popup-inner">
                            <h2>일정 생성</h2>
                            <label>제목:</label>
                            <input
                                type="text"
                                value={newEvent.title || ''}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                required
                            />
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
                                rows={4}
                                style={{ resize: 'none', height: '96px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}
                                value={newEvent.agenda}
                                onChange={(e) => setNewEvent({ ...newEvent, agenda: e.target.value })}
                            />
                            <label>카테고리:</label>
                            <select
                                value={newEvent.category || "plan"}
                                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
                            >
                                <option value="plan">일정</option>
                                <option value="meeting">회의</option>
                            </select>
                            <textarea
                                rows={2}
                                style={{ resize: 'none', height: '60px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}
                                value={newEvent.category}
                                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                            />
                            <button
                                onClick={() => handleAddEvent(newEvent)}
                                className="add-event-button"
                                disabled={!newEvent.title || !newEvent.start}
                            >
                                일정 추가
                            </button>
                            <button onClick={handleClosePopup} className="cancel-button">
                                취소
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="calender-container">
                {!whenToMeet ? (
                    <>
                        <div className="buttonys">
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
                        </div>

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
                            components={{ toolbar: CustomToolbar }}
                            onSelectEvent={(event, e) => handleEventMouseOver(event, e)}
                            onMouseOut={handleEventMouseOut}
                        />
                    </>
                ) : (
                    <WhenToMeetGrid onExit={exitWhenToMeet} />
                )}
            </div>

            <div
                className="event-popup"
                style={popupStyle}
                dangerouslySetInnerHTML={{ __html: popupContent }}
            />
        </div>
    );
};

export default Schedule;