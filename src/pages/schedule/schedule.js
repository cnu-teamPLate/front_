import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';
import MyCalendar from '../../components/Calendar/Calendar';

const userInfo = {
    "20211079": "Alice",
    "20211080": "Bob"
};

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

// 사용 가능 시간 매트릭스를 렌더링하는 컴포넌트
function AvailabilityMatrix({ selectedDates, start, end, events }) {
    // 마우스 오버된 셀에 표시할 사용자 리스트 상태
    const [hoveredUsers, setHoveredUsers] = useState([]);

    // 시간 문자열("9:00 AM" 등)을 시,분 객체로 변환
    const parseTime = (timeStr) => {
        const [hourMinute, ampm] = timeStr.split(' ');           // "9:00"과 "AM" 분리
        let [hour, minute] = hourMinute.split(':').map(Number);    // 시(hour), 분(minute) 숫자로 변환
        if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12; // PM일 때 12시간 추가
        if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0; // AM 12시 -> 0시
        return { hour, minute };                                  // { hour, minute } 객체 반환
    };

    // 시작 시간과 종료 시간 사이를 15분 단위로 분할한 타임슬롯 배열 생성
    const getTimeSlots = (startTimeStr, endTimeStr) => {
        const slots = [];
        const start = parseTime(startTimeStr);                    // 시작 시간 파싱
        const end = parseTime(endTimeStr);                        // 종료 시간 파싱
        let current = new Date(2000, 0, 1, start.hour, start.minute, 0);  // 임시 시작 Date
        const endDate = new Date(2000, 0, 1, end.hour, end.minute, 0);     // 임시 종료 Date
        while (current <= endDate) {                              // current가 end까지 돌 때까지 반복
            let hours = current.getHours();                       // 24시간 기준 시 얻기
            const minutes = current.getMinutes();                 // 분 얻기
            const ampm = hours >= 12 ? 'PM' : 'AM';               // AM/PM 결정
            hours = hours % 12;                                   // 12시간제로 변환
            if (hours === 0) hours = 12;                          // 0시 -> 12시
            const minuteStr = minutes === 0 ? '00' : minutes;     // 분 문자열 포매팅
            slots.push(`${hours}:${minuteStr} ${ampm}`);          // "h:mm AM/PM" 문자열 추가
            current = new Date(current.getTime() + 15 * 60000);   // 15분 증가
        }
        return slots;                                            // 타임슬롯 배열 반환
    };

    const timeSlots = getTimeSlots(start, end);                  // 타임슬롯 생성

    // 날짜 문자열과 시간 문자열을 합쳐 Date 객체로 반환
    const getCellDateTime = (dateStr, timeSlot) => {
        const { hour, minute } = parseTime(timeSlot);            // 시간 파싱
        const [year, month, day] = dateStr.split('-').map(Number); // "2025-7-15" -> [2025,7,15]
        return new Date(year, month - 1, day, hour, minute, 0);   // Date 객체 생성
    };

    // 특정 셀에 해당하는 가능한 사용자 리스트 반환
    const getUsersForCell = (dateStr, timeSlot) => {
        const cellTime = getCellDateTime(dateStr, timeSlot);     // 셀의 Date
        const overlappingEvents = events.filter(event => {
            const eventStart = new Date(event.start);            // 이벤트 시작 Date
            const eventEnd = new Date(event.end);                // 이벤트 종료 Date
            // 셀 시간에 이벤트가 겹치는지 확인
            return cellTime >= eventStart && cellTime < eventEnd;
        });
        // 겹치는 이벤트에서 사용자 이름 추출 후 중복 제거
        const names = overlappingEvents.map(event => userInfo[event.userId]).filter(Boolean);
        return [...new Set(names)];                              // 고유 사용자 리스트 반환
    };

    // 사용자 수에 비례해 셀 배경 투명도 조정
    const calculateCellColor = (userCount) => {
        const maxCount = 20;                                      // 최대 사용자 수 기준
        const intensity = Math.min(userCount / maxCount, 1);      // 투명도 비율 계산
        return `rgba(0, 200, 0, ${intensity})`;                   // 녹색 계열 rgba 문자열 반환
    };

    return (
        <div className="availability-matrix">
            {/* 헤더: 비어있는 첫 칸 + 날짜 칸 */}
            <div className="matrix-header" style={{ display: 'flex' }}>
                <div className="matrix-header-cell" style={{ width: '100px', border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                    {/* 빈 시간 레이블 칸 */}
                </div>
                {selectedDates.map(date => (
                    <div key={date} className="matrix-header-cell" style={{ flex: 1, border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                        {date}                                          {/* 날짜 문자열 표시 */}
                    </div>
                ))}
            </div>

            {/* 각 타임슬롯 행 렌더링 */}
            {timeSlots.map(slot => (
                <div key={slot} className="matrix-row" style={{ display: 'flex' }}>
                    {/* 시간 레이블 칸 */}
                    <div className="matrix-row-label" style={{ width: '100px', border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: '600' }}>
                        {slot}
                    </div>
                    {/* 각 날짜 셀 */}
                    {selectedDates.map(date => {
                        const users = getUsersForCell(date, slot);    // 셀별 가능한 사용자
                        return (
                            <div
                                key={`${date}-${slot}`}
                                className="matrix-cell"
                                style={{
                                    flex: 1,
                                    backgroundColor: calculateCellColor(users.length),
                                    minHeight: '40px',
                                    position: 'relative'
                                }}
                                onMouseEnter={() => setHoveredUsers(users)}    // 마우스 올릴 때 사용자 리스트 저장
                                onMouseLeave={() => setHoveredUsers([])}       // 마우스 떠날 때 초기화
                            >
                                {users.length > 0 && <span>{users.length}명 가능</span>} {/* 사용자 수 표시 */}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* 마우스 오버 시 팝업으로 사용자 리스트 표시 */}
            {hoveredUsers.length > 0 && (
                <div className="hover-popup" style={{ position: 'absolute', top: '10px', right: '10px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ddd' }}>
                    <h4>가능한 사용자</h4>
                    <ul>
                        {hoveredUsers.map(user => (
                            <li key={user}>{user}</li>            /* 사용자 이름 리스트 */
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}


// 시간 선택 그리드를 렌더링하는 컴포넌트
function TimeSelectionGrid({ selectedDates, start, end, onSelectTimes, selectedTimes }) {
    const [isDragging, setIsDragging] = useState(false);  // 드래그 중 여부
    const [toggleTo, setToggleTo] = useState(false);      // 드래그 시작 시 토글 상태 저장

    // 시간 문자열을 Date 객체로 변환 (오늘 날짜 기준)
    const parseTime = (timeStr) => {
        const [hourMinute, ampm] = timeStr.split(' ');
        let [hour, minute] = hourMinute.split(':').map(Number);
        if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        return date;                                       // 오늘 날짜 기반 시간 설정
    };

    // 시작/끝 시간 기준으로 15분 단위 라벨 생성
    const startDate = parseTime(start);
    const endDate = parseTime(end);
    const timeSlots = [];
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
        const hh = tempDate.getHours();
        const mm = tempDate.getMinutes();
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const hour12 = hh % 12 === 0 ? 12 : hh % 12;
        const minuteStr = mm === 0 ? '00' : mm;
        const label = `${hour12}:${minuteStr} ${ampm}`;
        timeSlots.push(label);                             // "h:mm AM/PM" 추가
        tempDate.setMinutes(tempDate.getMinutes() + 15);
    }

    // 드래그 시작 핸들러
    const handleMouseDown = (date, slot) => {
        setIsDragging(true);
        const cellKey = `${date}-${slot}`;
        const isSelected = selectedTimes.includes(cellKey); // 기존 선택 여부 확인
        setToggleTo(!isSelected);                           // 반대 상태로 토글 목표 설정
        onSelectTimes(cellKey, !isSelected);                // 첫 셀 토글
    };

    // 드래그 중 셀 엔터 핸들러
    const handleMouseEnter = (date, slot) => {
        if (!isDragging) return;                           // 드래그 중 아닐 땐 무시
        const cellKey = `${date}-${slot}`;
        const isSelected = selectedTimes.includes(cellKey);
        if (toggleTo !== isSelected) {
            onSelectTimes(cellKey, toggleTo);              // toggleTo 기준으로 상태 변경
        }
    };

    // 드래그 종료 핸들러
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="time-selection-grid" onMouseUp={handleMouseUp}> {/* 마우스 업 이벤트로 드래그 종료 */}
            {/* 헤더 행: Time 라벨 + 날짜들 */}
            <div className="time-grid-header" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="time-header-cell" style={{ flex: 1, border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                    Time
                </div>
                {selectedDates.map((date) => (
                    <div key={date} className="date-header-cell" style={{ flex: 1, border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                        {date}
                    </div>
                ))}
            </div>

            {/* 각 타임슬롯 행 렌더링 */}
            {timeSlots.map((slot) => (
                <div key={slot} className="time-grid-row" style={{ display: 'flex' }}>
                    {/* 시간 레이블 */}
                    <div className="time-row-label" style={{ flex: 1, border: '1px solid #ccc', padding: '6px', textAlign: 'center', fontWeight: '600' }}>
                        {slot}
                    </div>
                    {/* 날짜별 슬롯 */}
                    {selectedDates.map((date) => {
                        const cellKey = `${date}-${slot}`;
                        const isSelected = selectedTimes.includes(cellKey); // 선택 여부 체크
                        return (
                            <div
                                key={cellKey}
                                className={`time-slot ${isSelected ? 'selected' : ''}`} // 선택된 셀 클래스
                                style={{ flex: 1, border: '1px solid #ccc', padding: '6px', minHeight: '40px', textAlign: 'center' }}
                                onMouseDown={() => handleMouseDown(date, slot)} // 마우스 다운
                                onMouseEnter={() => handleMouseEnter(date, slot)} // 드래그 시 엔터
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

export { AvailabilityMatrix, TimeSelectionGrid };


/* 전체 흐름 관리 */
function WhenToMeetGrid({ onExit }) {
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState('false');
    const [error, setError] = useState('');
    // 이벤트 관련 상태
    const [eventTitle, setEventTitle] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedTimes, setSelectedTimes] = useState([]);

    // 시간 범위 & 타임존
    const [start, setEarliestTime] = useState('9:00 AM');
    const [end, setLatestTime] = useState('5:00 PM');
    const [timeZone, setTimeZone] = useState('Asia/Seoul');

    const convertToISO = (dateString, timeString, timeZone) => {
        const [hourMinute, ampm] = timeString.split(' ');
        let [hour, minute] = hourMinute.split(':').map(Number);

        // PM일 경우 12시간을 추가
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;

        const date = new Date(dateString);
        date.setHours(hour);
        date.setMinutes(minute);
        date.setSeconds(0);
        date.setMilliseconds(0);

        // 타임존 설정
        const localDate = new Date(date.toLocaleString("en-US", { timeZone }));
        return localDate.toISOString();
    };
    const handleCreateEvent = async () => {
        if (!validateStep()) return;
        setIsLoading(true);
        setError('');

        // 선택된 날짜에서 가장 첫 번째 날짜 사용
        const startDate = selectedDates[0];
        const endDate = selectedDates[selectedDates.length - 1];

        // ISO 형식으로 변환
        const startISO = convertToISO(startDate, start, timeZone);
        const endISO = convertToISO(endDate, end, timeZone);

        const requestData = {
            userId: "20211079",
            projId: "cse00001",
            start: startISO,
            end: endISO,
        };

        try {
            const response = await fetch(
                'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/auth/schedule/meeting/adjust/upload',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert('이벤트가 성공적으로 생성되었습니다.');
            } else {
                setError(data.message || '이벤트 생성에 실패했습니다.');
            }
        } catch (error) {
            setError('서버와 연결할 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

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
                                <select value={start} onChange={(e) => setEarliestTime(e.target.value)}>
                                    <option value="1:00 AM">1:00 AM</option>
                                    <option value="2:00 AM">2:00 AM</option>
                                    <option value="3:00 AM">3:00 AM</option>
                                    <option value="4:00 AM">4:00 AM</option>
                                    <option value="5:00 AM">5:00 AM</option>
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
                                    <option value="12:00 PM">12:00 PM</option>
                                </select>
                            </label>
                            <label>
                                No later than:
                                <select value={end} onChange={(e) => setLatestTime(e.target.value)}>
                                    <option value="1:00 AM">1:00 AM</option>
                                    <option value="2:00 AM">2:00 AM</option>
                                    <option value="3:00 AM">3:00 AM</option>
                                    <option value="4:00 AM">4:00 AM</option>
                                    <option value="5:00 AM">5:00 AM</option>
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
                                    <option value="12:00 PM">12:00 PM</option>
                                </select>
                            </label>
                        </div>
                        <div className="navigation-buttons">
                            <button onClick={nextStep}>Next</button>
                            {errors.eventTitle && <div className="error">{errors.eventTitle}</div>}
                            {errors.selectedDates && <div className="error">{errors.selectedDates}</div>}
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
                                start={start}
                                end={end}
                                selectedTimes={selectedTimes}
                                onSelectTimes={handleSelectTimes}
                            />
                            <AvailabilityMatrix
                                selectedDates={selectedDates}

                                start={start}
                                end={end}
                                events={dummyEvents}
                            />
                        </div>
                        <div className="navigation-buttons">
                            <button onClick={prevStep}>Back</button>
                            <button onClick={() => navigate('/schedule')}>Next</button>
                            {isLoading && <div className="loading">로딩 중...</div>}
                            {error && <div className="error-message">{error}</div>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
//-----------------여기까지가 웬투밋-----------------------------------------------------------------

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
    const [view, setView] = useState('month');

    const handleMonthVersion = () => {
        setView('month');
    };

    const handleWeekVersion = () => {
        setView('week');
    };
    const [events, setEvents] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [newEvent, setNewEvent] = useState({
        scheId: '',
        projId: '',
        date: '',
        scheName: '',
        place: '',
        category: '',
        detail: '',
        participants: '',
    });
    const [whenToMeet, setWhenToMeet] = useState(false);
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
        const userId = currentUser.id;
        const projId = currentProject.id;

        const newEvent = {
            //scheId: scheId,
            projId: projId,
            date: eventObject.start,
            scheName: eventObject.title,
            place: eventObject.location,
            category: "일정",
            detail: eventObject.agenda,
            participants: eventObject.attendees.split(',').map(p => p.trim())
        };

        try {

            const response = await fetch('https://port-0-localhost-m1w79fyl6ab28642.sel4.cloudtype.app/schedule/check/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEvent),
            });

            if (response.ok) {
                const savedEvent = await response.json();
                setEvents([...events, savedEvent]);
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
                ? 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/schedule/check/monthly'
                : 'http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/schedule/check/weekly';

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
    const fetchAvailability = async () => {
        try {
            const response = await fetch('http://ec2-3-34-140-89.ap-northeast-2.compute.amazonaws.com:8080/schedule/meeting/adjust/availability');
            const data = await response.json();
            if (Array.isArray(data)) {
                setAvailability(data);
            } else {
                setAvailability([]);
            }
        } catch (error) {
            console.error("API 호출 중 오류:", error.message);
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
