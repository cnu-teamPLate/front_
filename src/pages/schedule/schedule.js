import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';
import MyCalendar from '../../components/Calendar/Calendar';
/* ========== 1) 날짜 선택 달력 ========== */
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

/* ========== 2) 15분 단위 시간 선택 그리드 ========== */
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

    const handleMouseDown = (index) => {
        setIsDragging(true);
        const timeLabel = timeSlots[index];
        const isSelected = selectedTimes.includes(timeLabel);
        setToggleTo(!isSelected);
        onSelectTimes(timeLabel, !isSelected);
    };

    const handleMouseEnter = (index) => {
        if (isDragging) {
            const timeLabel = timeSlots[index];
            const isSelected = selectedTimes.includes(timeLabel);
            if (toggleTo !== isSelected) {
                onSelectTimes(timeLabel, toggleTo);
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="time-selection-grid" onMouseUp={handleMouseUp}>
            <div className="time-grid">
                {timeSlots.map((slot, index) => {
                    const isSelected = selectedTimes.includes(slot);
                    return (
                        <div
                            key={slot}
                            className={`time-slot ${isSelected ? 'selected' : ''}`}
                            onMouseDown={() => handleMouseDown(index)}
                            onMouseEnter={() => handleMouseEnter(index)}
                        >
                            <span className="slot-label">{slot}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ========== 3) 다중 Step으로 날짜/시간 선택 + 이벤트 제목 입력 ========== */
function WhenToMeetGrid() {
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});

    // 이벤트 관련 상태
    const [eventTitle, setEventTitle] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedTimes, setSelectedTimes] = useState([]);

    // 시간 범위 & 타임존
    const [earliestTime, setEarliestTime] = useState('9:00 AM');
    const [latestTime, setLatestTime] = useState('5:00 PM');
    const [timeZone, setTimeZone] = useState('Asia/Seoul');

    // 유효성 검사 함수
    const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
            // Step1: 이벤트 제목 필수
            if (!eventTitle.trim()) {
                newErrors.eventTitle = '제목을 입력해주세요.';
            }
            else if (selectedDates.length === 0) {
                newErrors.selectedDates = '최소 한 날짜는 선택해주세요.';
            }
        } else if (step === 2) {
            if (selectedTimes.length === 0) {
                newErrors.selectedTimes = '최소 한 시간은 포함시켜주세요.';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 단계 이동
    const nextStep = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };
    const prevStep = () => {
        setStep(step - 1);
    };

    // 날짜 선택/해제
    const handleSelectDate = (dateKey) => {
        setSelectedDates((prev) => {
            if (prev.includes(dateKey)) {
                return prev.filter((d) => d !== dateKey);
            } else {
                return [...prev, dateKey];
            }
        });
    };

    // 시간대 선택/해제
    const handleSelectTimes = (timeLabel, shouldSelect) => {
        setSelectedTimes((prev) => {
            if (shouldSelect) {
                if (!prev.includes(timeLabel)) {
                    return [...prev, timeLabel];
                }
                return prev;
            } else {
                return prev.filter((t) => t !== timeLabel);
            }
        });
    };

    // 최종 이벤트 생성- 실제 프로젝트에서는 서버로 전송하거나, 다음 페이지로 이동
    const handleCreateEvent = () => {
        if (!validateStep()) return;
        alert(`
        이벤트 제목: ${eventTitle}
        선택된 날짜: ${selectedDates.join(', ')}
        선택된 시간: ${selectedTimes.join(', ')}
        타임존: ${timeZone}
      `);
    };

    return (
        <div className="new-event-container">
            {/* STEP 1: 이벤트 제목 입력 */}
            {step === 1 && (
                <>
                    <div className="step-container">
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
                        <div className='errors'>
                            {errors.eventTitle && <p className="error">{errors.eventTitle}</p>}
                            {errors.selectedDates && <p className="error">{errors.selectedDates}</p>}
                        </div>
                    </div>
                    <div className="step2-container">
                        <h2>What times might work?</h2>
                        <div className="time-options">
                            <label>
                                No earlier than:
                                <select
                                    value={earliestTime}
                                    onChange={(e) => setEarliestTime(e.target.value)}
                                >
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
                                <select
                                    value={latestTime}
                                    onChange={(e) => setLatestTime(e.target.value)}
                                >
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
                                Time Zone:
                                <select
                                    value={timeZone}
                                    onChange={(e) => setTimeZone(e.target.value)}
                                >
                                    <option value="Asia/Seoul">Asia/Seoul</option>
                                    <option value="America/New_York">America/New_York</option>
                                    <option value="Europe/London">Europe/London</option>
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

                        <TimeSelectionGrid
                            selectedDates={selectedDates}
                            earliestTime={earliestTime}
                            latestTime={latestTime}
                            selectedTimes={selectedTimes}
                            onSelectTimes={handleSelectTimes}
                        />
                        {errors.selectedTimes && <p className="error">{errors.selectedTimes}</p>}

                        <div className="navigation-buttons">
                            <button onClick={prevStep}>Back</button>
                            <button onClick={handleCreateEvent}>Ready? Create Event</button>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
}
/* ─── react‑big‑calendar 관련 커스텀 컴포넌트 ─────────────────────────── */
// 사용자 정보 (예시)
const userInfo = {
    "20211079": {
        name: "Alice",
    },
    "20211080": {
        name: "Bob",
    },
    // 추가 사용자 정보…
};

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

/* ─── Schedule 메인 컴포넌트 ─────────────────────────────────────────── */
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
            // 이미 선택된 경우 선택 취소 (이벤트 제거)
            setEvents(events.filter(event => event !== existing));
        } else {
            // 선택되지 않은 경우 이벤트 추가 (타이틀은 'Available'로 표시)
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

                {/* whenToMeet 상태에 따라 react‑big‑calendar 또는 커스텀 그리드 렌더링 */}
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
                    <WhenToMeetGrid />
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
