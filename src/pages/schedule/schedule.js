import { useNavigate, Link, useLocation } from "react-router-dom";
import React, { useMemo, useState, useEffect, useCallback } from 'react'; // useCallback added
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';
import MyCalendar from '../../components/Calendar/Calendar';
import WhenToMeetGrid, { AvailabilityMatrix, TimeSelectionGrid, fetchEventsApi, fetchAvailabilityApi } from "./when2meet";

// 파일 맨 위쪽 - API URL을 새 URL로 업데이트
const API = 'https://www.teamplate-api.site';

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
        const target = !already;             // 클릭 시 반대로
        setDragToSelect(target);
        setIsDragging(true);
        ensureState(dateKey, target);        // 첫 칸 즉시 반영
    };

    const handleMouseEnterDay = (dateKey) => {
        if (!isDragging) return;
        ensureState(dateKey, dragToSelect);  // 드래그 중엔 모두 동일 상태로
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
                    onSelectDate={onSelectDate}            // 그대로 전달(단일 클릭 토글에도 쓰임)
                    onMouseDownDay={handleMouseDownDay}    // ⬅ 추가
                    onMouseEnterDay={handleMouseEnterDay}  // ⬅ 추가
                    onMouseUp={handleMouseUp}              // ⬅ 추가
                />
                <DatePickerGrid
                    _ currentYear={nextDate.getFullYear()}
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
    const [newEvent, setNewEvent] = useState({
        //scheId: '', // 서버에서 생성
        projId: '',
        date: '',
        scheName: '', // '일정명' (제목) 필드
        place: '',
        category: '',
        detail: '',
        participants: '',
        start: '', // 캘린더 팝업용 start
        end: '', // 캘린더 팝업용 end
    });
    const [whenToMeet, setWhenToMeet] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popupContent, setPopupContent] = useState('');
    const [popupStyle, setPopupStyle] = useState({ display: 'none', top: 0, left: 0 });
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState([]);


    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCreateEvent = () => {
        // 팝업이 열릴 때 newEvent 상태 초기화 (필요시)
        setNewEvent({
            projId: currentProject, // 미리 projectId 설정
            date: '',
            scheName: '',
            place: '',
            category: 'meeting', // 기본값
            detail: '',
            participants: '',
            start: '',
            end: '',
        });
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    const handleWhenToMeet = () => {
        setWhenToMeet(true);
    };


    const handleSelectSlot = ({ start, end }) => {
        // BUG FIX: currentUser와 currentProject는 .id가 없는 문자열입니다.
        const userId = currentUser;
        const projId = currentProject;
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
        // SAFETY CHECK: event.agenda 등이 null일 수 있으므로 || '' 추가
        const agendaItems = (event.agenda || '').split('\n')
            .map((item, idx) => `<li key=${idx}>${item}</li>`)
            .join('');

        setPopupContent(
            `<div><strong>${event.title || '일정'}</strong></div>
       <div>시간: ${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}</div>
       <div>장소: ${event.location || 'N/A'}</div>
       <div>대상: ${event.attendees || 'N/A'}</div>
       <div>카테고리: ${event.category || 'N/A'}</div>
       <div>안건:</div>
       <ul>
          ${agendaItems}
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

    // onExit 함수는 WhenToMeetGrid에서 onExit prop으로 전달됨
    const exitWhenToMeet = () => {
        setWhenToMeet(false);
        // 일정 목록 새로고침
        fetchEvents();
    };

    // 일정 생성 API 연결
    const handleAddEvent = async (eventObject) => {
        // BUG FIX: currentUser와 currentProject는 .id가 없는 문자열입니다.
        const projId = currentProject;

        // 팝업에서 입력받은 newEvent(eventObject)를 API DTO에 맞게 매핑
        const newEventPayload = {
            projId: projId,
            date: eventObject.start, // 팝업의 '시작 시간'
            // end Time은 API 명세에 따라 별도 필드가 필요할 수 있음 (현재는 date만 전송)
            scheName: eventObject.scheName, // BUG FIX: eventObject.title -> eventObject.scheName
            place: eventObject.location,
            category: eventObject.category, // 팝업의 '카테고리'
            detail: eventObject.agenda, // 팝업의 '안건'
            participants: (eventObject.attendees || '').split(',').map(p => p.trim())
        };

        try {
            // API FIX: URL을 새 API 상수로 변경
            const response = await fetch(`${API}/schedule/check/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEventPayload),
            });

            if (response.ok) {
                const savedEvent = await response.json(); // 서버 응답이 이벤트 객체라고 가정
                // fetchEvents()를 다시 호출하여 캘린더를 새로고침
                fetchEvents();
                setShowPopup(false);
            } else {
                const error = await response.text();
                console.error("Failed to create event:", error);
                alert("일정 생성에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error creating event:", error);
            alert("서버와 연결할 수 없습니다.");
        }
    };

    // REFACTOR: fetchEvents를 useCallback으로 감싸고, 새 API 명세에 맞게 수정
    const fetchEvents = useCallback(async () => {
        if (!currentProject || !currentUser) {
            console.warn("Project ID 또는 User ID가 없습니다. API를 호출할 수 없습니다.");
            return;
        }
        setLoading(true);
        try {
            const result = await fetchEventsApi({ projId: currentProject, userId: currentUser, currentDate, view });
            setEvents(result || []);
        } catch (e) {
            console.error("API 호출 중 오류:", e.message || e);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [view, currentDate, currentProject, currentUser]);


    // 일정 조회 (주간/월간)
    useEffect(() => {
        fetchEvents();
        // FIX: fetchAvailability() 호출은 when2meetId가 있을 때만
        // fetchAvailability(); // <- 여기서 호출하면 안 됨
    }, [fetchEvents]); // REFACTOR: fetchEvents가 useCallback으로 감싸졌으므로 의존성으로 사용


    const fetchAvailability = async (id) => {
        const data = await fetchAvailabilityApi(id);
        if (data && typeof data === 'object') {
            setAvailability(data.details || data);
        } else {
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

                            {/* BUG FIX: '일정명' (scheName) 입력 필드 추가 */}
                            <label>일정명:</label>
                            <input
                                type="text"
                                value={newEvent.scheName}
                                onChange={(e) => setNewEvent({ ...newEvent, scheName: e.target.value })}
                                placeholder="예: 주간 정기 회의"
                            />

                            <label>시작 시간:</label>
                            _                     <input
                                type="datetime-local"
                                value={newEvent.start}
                                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                                _ />
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
                                placeholder="예: 온라인 (Zoom)"
                            />
                            <label>참석자:</label>
                            <input
                                type="text"
                                value={newEvent.attendees}
                                onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                                placeholder="쉼표(,)로 구분"
                            />
                            <label>안건 (상세내용):</label>
                            <textarea
                                rows={4}
                                style={{ resize: 'none', height: '96px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}
                                value={newEvent.agenda} // 'detail' 대신 'agenda' 사용
                                _ onChange={(e) => setNewEvent({ ...newEvent, agenda: e.target.value })}
                            />
                            <label>카테고리:</label>
                            <input
                                _ type="text"
                                value={newEvent.category}
                                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                placeholder="예: meeting, task"
                            />
                            <button onClick={() => handleAddEvent(newEvent)} className="add-event-button">
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
                        // onMouseOut={handleEventMouseOut} // 이 핸들러는 캘린더 자체보다 툴팁에 붙이는 것이 더 나을 수 있습니다.
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
                onMouseLeave={handleEventMouseOut} // 팝업에서 마우스가 나갈 때 닫기
            />
        </div>
    );
};

export default Schedule;