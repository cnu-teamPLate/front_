import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';
import MyCalendar from '../../components/Calendar/Calendar';

// 더미 이벤트 데이터 (예시)
const dummyEvents = [
    {
        userId: "20211079",
        projId: "cse00001",
        start: "2025-01-14T09:00:00.000Z",
        end: "2025-01-14T10:00:00.000Z",
        title: "Dummy Event 1"
    },
    {
        userId: "20211080",
        projId: "cse00001",
        start: "2025-01-14T09:15:00.000Z",
        end: "2025-01-14T09:45:00.000Z",
        title: "Dummy Event 2"
    },
    {
        userId: "20211079",
        projId: "cse00001",
        start: "2025-01-14T10:00:00.000Z",
        end: "2025-01-14T10:30:00.000Z",
        title: "Dummy Event 3"
    },
    {
        userId: "20211080",
        projId: "cse00001",
        start: "2025-01-14T10:15:00.000Z",
        end: "2025-01-14T11:00:00.000Z",
        title: "Dummy Event 4"
    },
    {
        userId: "20211079",
        projId: "cse00001",
        start: "2025-01-14T11:00:00.000Z",
        end: "2025-01-14T12:00:00.000Z",
        title: "Dummy Event 5"
    }
];

// 사용자 정보 매핑 (userId -> 사용자 이름)
const userInfo = {
    "20211079": "Alice",
    "20211080": "Bob"
};

/* 1) 날짜 선택 달력 */
function DatePickerGrid({ currentYear, currentMonth, onSelectDate, selectedDates }) {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();

    const calendarCells = [];
    for (let i = 0; i < startDay; i++) {
        calendarCells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarCells.push(day);
    }

    const handleClickDay = (day) => {
        if (!day) return;
        const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
        onSelectDate(dateKey);
    };

    return (
        <div className="date-picker-grid">
            <div className="month-label">
                {currentYear}년 {currentMonth + 1}월
            </div>
            <div className="weekdays">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            <div className="days">
                {calendarCells.map((cell, index) => {
                    if (cell === null) {
                        return <div key={index} className="day-cell empty" />;
                    }
                    const dateKey = `${currentYear}-${currentMonth + 1}-${cell}`;
                    const isSelected = selectedDates.includes(dateKey);
                    return (
                        <div
                            key={index}
                            className={`day-cell ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleClickDay(cell)}
                        >
                            {cell}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* 2) 읽기 전용 Availability Matrix */
function AvailabilityMatrix({ selectedDates, earliestTime, latestTime, events }) {
    const parseTime = (timeStr) => {
        const [hourMinute, ampm] = timeStr.split(' ');
        let [hour, minute] = hourMinute.split(':').map(Number);
        if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
        return { hour, minute };
    };

    const getTimeSlots = (startTimeStr, endTimeStr) => {
        const slots = [];
        const start = parseTime(startTimeStr);
        const end = parseTime(endTimeStr);
        let current = new Date(2000, 0, 1, start.hour, start.minute, 0);
        const endDate = new Date(2000, 0, 1, end.hour, end.minute, 0);
        while (current <= endDate) {
            let hours = current.getHours();
            const minutes = current.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            if (hours === 0) hours = 12;
            const minuteStr = minutes === 0 ? '00' : minutes;
            slots.push(`${hours}:${minuteStr} ${ampm}`);
            current = new Date(current.getTime() + 15 * 60000);
        }
        return slots;
    };

    const timeSlots = getTimeSlots(earliestTime, latestTime);

    const getCellDateTime = (dateStr, timeSlot) => {
        const { hour, minute } = parseTime(timeSlot);
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, hour, minute, 0);
    };

    const getUsersForCell = (dateStr, timeSlot) => {
        const cellTime = getCellDateTime(dateStr, timeSlot);
        const overlappingEvents = events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return cellTime >= eventStart && cellTime < eventEnd;
        });
        const names = overlappingEvents.map(event => userInfo[event.userId]).filter(Boolean);
        return [...new Set(names)];
    };

    return (
        <div className="availability-matrix">
            <div className="matrix-header" style={{ display: 'flex' }}>
                <div
                    className="matrix-header-cell"
                    style={{
                        width: '100px',
                        border: '1px solid #ccc',
                        padding: '6px',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}
                >
                    Time
                </div>
                {selectedDates.map(date => (
                    <div
                        key={date}
                        className="matrix-header-cell"
                        style={{
                            flex: 1,
                            border: '1px solid #ccc',
                            padding: '6px',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}
                    >
                        {date}
                    </div>
                ))}
            </div>
            {timeSlots.map(slot => (
                <div key={slot} className="matrix-row" style={{ display: 'flex' }}>
                    <div
                        className="matrix-row-label"
                        style={{
                            width: '100px',
                            border: '1px solid #ccc',
                            padding: '6px',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}
                    >
                        {slot}
                    </div>
                    {selectedDates.map(date => {
                        const users = getUsersForCell(date, slot);
                        return (
                            <div
                                key={`${date}-${slot}`}
                                className="matrix-cell"
                                style={{
                                    flex: 1,
                                    border: '1px solid #ccc',
                                    padding: '6px',
                                    minHeight: '40px',
                                    textAlign: 'center'
                                }}
                            >
                                {users.join(', ')}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

/* 3) 드래그 가능한 Time Selection Grid */
function TimeSelectionGrid({ selectedDates, earliestTime, latestTime, onSelectTimes, selectedTimes }) {
    const [isDragging, setIsDragging] = useState(false);
    const [toggleTo, setToggleTo] = useState(false);

    const parseTime = (timeStr) => {
        const [hourMinute, ampm] = timeStr.split(' ');
        let [hour, minute] = hourMinute.split(':').map(Number);
        if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date;
    };

    const startDate = parseTime(earliestTime);
    const endDate = parseTime(latestTime);
    const timeSlots = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
        const hh = tempDate.getHours();
        const mm = tempDate.getMinutes();
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const hour12 = hh % 12 === 0 ? 12 : hh % 12;
        const minuteStr = mm === 0 ? '00' : mm;
        const label = `${hour12}:${minuteStr} ${ampm}`;
        timeSlots.push(label);
        tempDate.setMinutes(tempDate.getMinutes() + 15);
    }

    const handleMouseDown = (date, slot) => {
        setIsDragging(true);
        const cellKey = `${date}-${slot}`;
        const isSelected = selectedTimes.includes(cellKey);
        setToggleTo(!isSelected);
        onSelectTimes(cellKey, !isSelected);
    };

    const handleMouseEnter = (date, slot) => {
        if (!isDragging) return;
        const cellKey = `${date}-${slot}`;
        const isSelected = selectedTimes.includes(cellKey);
        if (toggleTo !== isSelected) {
            onSelectTimes(cellKey, toggleTo);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="time-selection-grid" onMouseUp={handleMouseUp}>
            <div className="time-grid-header">
                <div className="time-header-cell"
                    style={{
                        width: '100px',
                        border: '1px solid #ccc',
                        padding: '6px',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}
                >
                    Time</div>
                {selectedDates.map((date) => (
                    <div key={date}
                        className="date-header-cell"
                        style={{
                            flex: 1,
                            border: '1px solid #ccc',
                            padding: '6px',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}
                    >
                        {date}
                    </div>
                ))}
            </div>
            {timeSlots.map((slot) => (
                <div key={slot} className="time-grid-row">
                    <div className="time-row-label"
                        style={{
                            width: '100px',
                            border: '1px solid #ccc',
                            padding: '6px',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}
                    >
                        {slot}
                    </div>
                    {selectedDates.map((date) => {
                        const cellKey = `${date}-${slot}`;
                        const isSelected = selectedTimes.includes(cellKey);
                        return (
                            <div
                                key={cellKey}
                                className={`time-slot ${isSelected ? 'selected' : ''}`}
                                style={{
                                    flex: 1,
                                    border: '1px solid #ccc',
                                    padding: '6px',
                                    minHeight: '40px',
                                    textAlign: 'center'
                                }}

                                onMouseDown={() => handleMouseDown(date, slot)}
                                onMouseEnter={() => handleMouseEnter(date, slot)}
                            />
                        );
                    })
                    }
                </div>
            ))
            }
        </div >
    );
}

/* 4) WhenToMeetGrid: 전체 흐름 관리 */
function WhenToMeetGrid({ onExit }) {
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});

    // 이벤트 관련 상태
    const [eventTitle, setEventTitle] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedTimes, setSelectedTimes] = useState([]);

    // 시간 범위 & 타임존
    const [earliestTime, setEarliestTime] = useState('9:00 AM');
    const [latestTime, setLatestTime] = useState('5:00 PM');

    const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
            if (!eventTitle.trim()) {
                newErrors.eventTitle = '제목을 입력해주세요.';
            } else if (selectedDates.length === 0) {
                newErrors.selectedDates = '최소 한 날짜는 선택해주세요.';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const handleSelectDate = (dateKey) => {
        setSelectedDates((prev) =>
            prev.includes(dateKey) ? prev.filter((d) => d !== dateKey) : [...prev, dateKey]
        );
    };

    const handleSelectTimes = (cellKey, shouldSelect) => {
        setSelectedTimes((prev) => {
            if (shouldSelect) {
                if (!prev.includes(cellKey)) {
                    return [...prev, cellKey];
                }
                return prev;
            } else {
                return prev.filter((item) => item !== cellKey);
            }
        });
    };
    const navigate = useNavigate();


    return (
        <div className="new-event-container">
            {step === 1 && (
                <>
                    <div className="step-container">
                        <button className="back" onClick={onExit}>뒤로 가기</button>
                        <h1>Create New Event</h1>
                        <label>
                            Event Title:
                            <input
                                type="text"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                placeholder="Enter event title"
                            />
                        </label>
                        <h2>What dates might work?</h2>
                        <p>Click and drag dates to select in the calendar</p>
                        <DatePickerGrid
                            currentYear={2025}
                            currentMonth={2}
                            selectedDates={selectedDates}
                            onSelectDate={handleSelectDate}
                        />
                        <DatePickerGrid
                            currentYear={2025}
                            currentMonth={3}
                            selectedDates={selectedDates}
                            onSelectDate={handleSelectDate}
                        />
                        <div className="errors">
                            {errors.eventTitle && <p className="error">{errors.eventTitle}</p>}
                            {errors.selectedDates && <p className="error">{errors.selectedDates}</p>}
                        </div>
                    </div>
                    <div className="step2-container">
                        <h2>What times might work?</h2>
                        <div className="time-options">
                            <label>
                                No earlier than:
                                <select value={earliestTime} onChange={(e) => setEarliestTime(e.target.value)}>
                                    <option value="6:00 AM">6:00 AM</option>
                                    <option value="7:00 AM">7:00 AM</option>
                                    <option value="8:00 AM">8:00 AM</option>
                                    <option value="9:00 AM">9:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="12:00 PM">12:00 PM</option>
                                    <option value="1:00 PM">1:00 PM</option>
                                    <option value="2:00 PM">2:00 PM</option>
                                    <option value="3:00 PM">3:00 PM</option>
                                    <option value="4:00 PM">4:00 PM</option>
                                    <option value="5:00 PM">5:00 PM</option>
                                    <option value="6:00 PM">6:00 PM</option>
                                    <option value="7:00 PM">7:00 PM</option>
                                    <option value="8:00 PM">8:00 PM</option>
                                    <option value="9:00 PM">9:00 PM</option>
                                    <option value="10:00 PM">10:00 PM</option>
                                    <option value="11:00 PM">11:00 PM</option>
                                </select>
                            </label>
                            <label>
                                No later than:
                                <select value={latestTime} onChange={(e) => setLatestTime(e.target.value)}>
                                    <option value="6:00 AM">6:00 AM</option>
                                    <option value="7:00 AM">7:00 AM</option>
                                    <option value="8:00 AM">8:00 AM</option>
                                    <option value="9:00 AM">9:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="12:00 PM">12:00 PM</option>
                                    <option value="1:00 PM">1:00 PM</option>
                                    <option value="2:00 PM">2:00 PM</option>
                                    <option value="3:00 PM">3:00 PM</option>
                                    <option value="4:00 PM">4:00 PM</option>
                                    <option value="5:00 PM">5:00 PM</option>
                                    <option value="6:00 PM">6:00 PM</option>
                                    <option value="7:00 PM">7:00 PM</option>
                                    <option value="8:00 PM">8:00 PM</option>
                                    <option value="9:00 PM">9:00 PM</option>
                                    <option value="10:00 PM">10:00 PM</option>
                                    <option value="11:00 PM">11:00 PM</option>
                                </select>
                            </label>
                        </div>
                        <div className="navigation-buttons">
                            <button onClick={nextStep}>Next</button>
                        </div>
                    </div>
                </>
            )}
            {step === 2 && (
                <>
                    <div className="step-container">
                        <button className="back" onClick={onExit}>뒤로 가기</button>
                        <div className="when-to-meet-container" style={{ display: 'flex', gap: '20px' }}>
                            <TimeSelectionGrid
                                selectedDates={selectedDates}
                                earliestTime={earliestTime}
                                latestTime={latestTime}
                                selectedTimes={selectedTimes}
                                onSelectTimes={handleSelectTimes}
                            />
                            <AvailabilityMatrix
                                selectedDates={selectedDates}
                                earliestTime={earliestTime}
                                latestTime={latestTime}
                                events={dummyEvents} //여기를 벡엔드에서 받아야함
                            />
                        </div>
                        <div className="navigation-buttons">
                            <button onClick={prevStep}>Back</button>
                            <button onClick={() => navigate('/schedule')}>Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* 5) react-big-calendar 관련 커스텀 컴포넌트 */
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
    const [events, setEvents] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        start: '',
        end: '',
        location: '',
        attendees: '',
        agenda: '',
        category: '',
    });
    const [whenToMeet, setWhenToMeet] = useState(false);
    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popupContent, setPopupContent] = useState('');
    const [popupStyle, setPopupStyle] = useState({ display: 'none', top: 0, left: 0 });

    const currentUser = { id: "20211079" };
    const currentProject = { id: "cse00001" };

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

    const handleMonthVersion = () => {
        setView('month');
    };

    const handleWeekVersion = () => {
        setView('week');
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

    // onExit 함수는 WhenToMeetGrid에서 onExit prop으로 전달됨
    const exitWhenToMeet = () => {
        setWhenToMeet(false);
    };

    return (
        <div className="Dashboard">
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
                            <label>카테고리:</label>
                            <textarea
                                value={newEvent.category}
                                onChange={(e) => setNewEvent({ ...newEvent, categoty: e.target.value })}
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
                        <div className="buttons">
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
