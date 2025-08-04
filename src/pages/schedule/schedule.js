import { useNavigate, Link, useLocation } from "react-router-dom";
import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';
import MyCalendar from '../../components/Calendar/Calendar';
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

function AvailabilityMatrix({ form, details, allData }) {
    /* ───────────────────── 기본 파싱 값 ───────────────────── */
    console.log("form: ", form);
    console.log("details: ", details);

    const selectedDates = form.dates.map(d => d.startDate);  // ["2025-05-27", …]
    console.log('selectedDates', selectedDates);
    const start = form.startTime;   // "09:00:00"
    const end = form.endTime;     // "22:00:00"
    const padDate = (dateStr) => {
        // "2025-3-4" → "2025-03-04"
        const [y, m, d] = dateStr.split('-').map(Number);
        const pad = (n) => String(n).padStart(2, '0');
        return `${y}-${pad(m)}-${pad(d)}`;
    };
    const availabilityMap = useMemo(() => {
        const map = new Map(); // key = `${date}-${slot}`
        Object.entries(details).forEach(([dateFull, arr]) => {
            const dateUnpadded = `${+dateFull.slice(0, 4)}-${+dateFull.slice(5, 7)}-${+dateFull.slice(8)}`;
            // ex) "2025-03-04" → "2025-3-4"

            arr.forEach(({ startTime, endTime, username }) => {


                const fmt = 'YYYY-MM-DDTH:mm:ss';
                let cur = moment(`${dateFull}T${startTime}`, fmt, true); const end = moment(`${dateFull}T${endTime}`, fmt, true);
                while (cur < end) {
                    const slot = cur.format('h:mm A');           // "2:15 PM"
                    // ① 패딩 있는 key
                    const key1 = `${dateFull}-${slot}`;
                    if (!map.has(key1)) map.set(key1, new Set());
                    map.get(key1).add(username);

                    // ② 패딩 없는 key
                    const key2 = `${dateUnpadded}-${slot}`;
                    if (!map.has(key2)) map.set(key2, new Set());
                    map.get(key2).add(username);

                    cur.add(15, 'minutes');
                }
            });
        });
        return map;
    }, [details]);

    /* ───────────── 2) 24h 문자열 → 시·분 파서 ────────────── */
    const parseTime24 = (hhmmss) => {
        const [h, m] = hhmmss.split(':').map(Number);
        return { hour: h, minute: m };
    };

    /* ───────────── 3) 타임슬롯 라벨 생성 ────────────── */
    const getTimeSlots = (from, to) => {
        const slots = [];
        const s = parseTime24(from);
        const e = parseTime24(to);
        let cur = new Date(2000, 0, 1, s.hour, s.minute);
        const endDate = new Date(2000, 0, 1, e.hour, e.minute);
        while (cur <= endDate) {
            let h = cur.getHours();
            const m = cur.getMinutes();
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12; if (h === 0) h = 12;
            slots.push(`${h}:${m.toString().padStart(2, '0')} ${ampm}`);
            cur = new Date(cur.getTime() + 15 * 60000);
        }
        return slots;
    };

    const timeSlots = useMemo(() => getTimeSlots(start, end), [start, end]);

    const getUsersForCell = (date, slot) => {
        // date 는 달력에서 온 값. 패딩이 없을 수 있음
        const padded = padDate(date);          // "2025-3-4" → "2025-03-04"
        return [
            ...(availabilityMap.get(`${date}-${slot}`) || []), // un‑padded
            ...(availabilityMap.get(`${padded}-${slot}`) || [])  // padded
        ];
    };


    /* ───────────── 5) 셀 배경 색상 계산 ────────────── */
    const maxCount = useMemo(() => {
        let max = 1;
        availabilityMap.forEach(set => { if (set.size > max) max = set.size; });
        return max;
    }, [availabilityMap]);

    const bgColor = (cnt) => `rgba(0,200,0,${cnt / maxCount})`;

    /* ───────────── 6) 렌더링 ────────────── */
    const [hovered, setHovered] = useState([]);

    return (
        <div className="availability-matrix" style={{ position: 'relative' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex' }}>
                <div style={{ width: 100 }} />
                {selectedDates.map(d => (
                    <div key={d} style={{ flex: 1, border: '1px solid #ccc', padding: 6, fontWeight: 'bold', textAlign: 'center' }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* 바디 */}
            {timeSlots.map(slot => (
                <div key={slot} style={{ display: 'flex' }}>
                    <div style={{ width: 100, border: '1px solid #ccc', padding: 6, textAlign: 'center', fontWeight: 600 }}>
                        {slot}
                    </div>
                    {selectedDates.map(date => {
                        const users = getUsersForCell(date, slot);
                        return (
                            <div
                                key={`${date}-${slot}`}
                                style={{ flex: 1, border: '1px solid #ccc', minHeight: 40, background: bgColor(users.length) }}
                                onMouseEnter={() => setHovered(users)}
                                onMouseLeave={() => setHovered([])}
                            >
                                {/* {users.length > 0 && <span>{users.length}명 가능</span>} */}
                                {users.length > 0 && <span>{allData[date] === undefined ? "" : allData[date].length}명 가능</span>}
                                {/* {<span>{date}</span>} */}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Hover 팝업 */}
            {hovered.length > 0 && (
                <div style={{
                    position: 'absolute', top: 10, right: 10, background: '#fff',
                    border: '1px solid #ddd', padding: 10
                }}>
                    <strong>가능한 사용자</strong>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {hovered.map((u, idx) => <li key={`${u}-${idx}`}>{u}</li>)}                    </ul>
                </div>
            )}
        </div>
    );
}
// 시간 선택 그리드를 렌더링하는 컴포넌트
function TimeSelectionGrid({ selectedDates, start, end, onSelectTimes, selectedTimes, allData }) {
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
function WhenToMeetGrid({ onExit, notifications = [] }) {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const projId = urlParams.get("projectId");
    const currentUserId = localStorage.getItem('userId');
    const [remoteForm, setRemoteForm] = useState(null);   // GET /form 응답
    const [remoteDetails, setRemoteDetails] = useState(null);   // GET /details 응답

    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
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
    useEffect(() => {
        if (!projId) return;
    }, [projId]);
    useEffect(() => {
        if (!projId) return;
    }, [projId, currentUserId]);

    // ────────────────────────────────────────────────────────────────
    // ② 개별 사용자의 가용 시간 업로드 (선택 완료 후 호출)
    const uploadAvailability = async (when2meetId) => {
        if (selectedTimes.length === 0) {
            alert('한 칸 이상 선택해 주세요.');
            return;
        }

        // ─── uploadAvailability 안의 helper 함수만 교체 ───
        const parseCellKey = (key) => {
            // 예: "2025-05-27-2:30 PM"
            const lastDash = key.lastIndexOf('-');      // 날짜·시간 구분 위치
            const datePart = key.slice(0, lastDash);    // "2025-05-27"
            const timePart = key.slice(lastDash + 1);   // "2:30 PM"

            const [time, ampm] = timePart.split(' ');   // ["2:30", "PM"]
            let [h, m] = time.split(':').map(Number);   // [2, 30]
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;

            const [y, mo, d] = datePart.split('-').map(Number); // [2025, 05, 27]
            return new Date(y, mo - 1, d, h, m, 0, 0);          // 정상 Date 객체
        };


        // ① 셀 목록 → 연속 구간 묶기 (15분 간격)
        const sorted = [...selectedTimes].sort(
            (a, b) => parseCellKey(a) - parseCellKey(b)
        );
        const ranges = [];
        let rangeStart = parseCellKey(sorted[0]);
        let prev = rangeStart;

        for (let i = 1; i < sorted.length; i++) {
            const cur = parseCellKey(sorted[i]);
            const diff = (cur - prev) / 60000;           // 분 단위 차이
            if (diff !== 15) {                           // 끊김 발생
                ranges.push({ start: rangeStart, end: new Date(prev.getTime() + 15 * 60000) });
                rangeStart = cur;
            }
            prev = cur;
        }
        // 마지막 구간 push
        ranges.push({ start: rangeStart, end: new Date(prev.getTime() + 15 * 60000) });

        // ② 구간 → Swagger 스키마 형식
        const userRanges = ranges.map(r => ({
            startDate: r.start.toISOString().slice(0, 19),   // "YYYY‑MM‑DDTHH:MM:SS"
            endDate: r.end.toISOString().slice(0, 19)
        }));

        const body = {
            when2meetId,
            details: [{
                userId: '20211079',
                username: '홍길동',
                dates: userRanges
            }]
        };

        try {
            const res = await fetch(`${API}/schedule/meeting/upload/when2meet/detail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '업로드 실패');
            alert(data.message || '가용 시간이 업로드되었습니다.');
        } catch (e) {
            setError(e.message);
        }
    };
    // ────────────────────────────────────────────────────────────────

    /** "9:00 AM" → "09:00:00" */
    const toHHMMSS = (timeStr) => {
        const [hourMinute, ampm] = timeStr.split(' ');
        let [h, m] = hourMinute.split(':').map(Number);
        if (ampm?.toLowerCase() === 'pm' && h < 12) h += 12;
        if (ampm?.toLowerCase() === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    };
    const handleCreatewhen2meet = async () => {
        if (!validateStep()) return null;
        setIsLoading(true);
        setError('');
        const requestData = {
            title: eventTitle.trim(),
            projId: 'cse00001',
            startTime: toHHMMSS(start),   // "09:00:00"
            endTime: toHHMMSS(end),     // "22:00:00" 등
            dates: selectedDates
                .sort()                   // 날짜 배열 오름차순 정리 
                .map(d => {
                    // d 예시: "2025-5-1" → "2025-05-01"
                    const [y, m, day] = d.split('-').map(Number);
                    const pad = (n) => String(n).padStart(2, '0');
                    const dateStr = `${y}-${pad(m)}-${pad(day)}`;
                    return { startDate: dateStr, endDate: dateStr };
                })

        };
        try {
            const response = await fetch(
                `${API}/schedule/meeting/upload/when2meet`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                }
            );

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || '폼 생성 실패');

            // ✅ 정상 생성( code === 0 ) → id 반환
            if (data.code === 0 && data.when2meetId) {
                setFormId(data.when2meetId);   // state 보관
                return data.when2meetId;       // **← 호출부에 id 전달**
            } else {
                setError(data.message || '알 수 없는 오류');
                return null;
            }
        } catch (e) {
            setError(e.message);
            return null;
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
    const [formId, setFormId] = useState(null);
    const loadWhen2Meet = async (id) => {
        try {
            const res = await fetch(`${API}/schedule/meeting/view/when2meet?when2meetId=${id}`);
            const json = await res.json();
            setRemoteForm(json.form);        // form 객체 그대로
            setRemoteDetails(json.details);  // { "YYYY‑MM‑DD": [ … ] } 형태
            console.log("웬투밋 호출 결과", json.details);
        } catch (e) {
            console.error('view API 실패', e);
            setError('폼 정보를 가져오지 못했습니다.');
        }
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
                        <TwoMonthPicker
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
                            <button
                                onClick={async () => {
                                    /* ① 입력 검증 */
                                    if (!validateStep()) return;

                                    /* ② 폼 생성 → id */

                                    //const id = await handleCreatewhen2meet();
                                    const id = 1;//⭐//Todo //API들어오면 바꾸기

                                    if (!id) return;                // 실패 시 중단

                                    /* ③ state 에 저장 + 서버에서 최신 form/details 가져오기 */
                                    setFormId(id);
                                    await loadWhen2Meet(id);

                                    /* ④ 다음 단계로 이동 */
                                    nextStep();
                                }}
                            >
                                Next
                            </button>                            {errors.eventTitle && <div className="error">{errors.eventTitle}</div>}
                            {errors.selectedDates && <div className="error">{errors.selectedDates}</div>}
                        </div>
                    </div>
                </>
            )}
            {step === 2 && (
                <>
                    <div className="step-container">
                        <button className="back" onClick={onExit}>홈으로 가기</button>
                        <div className="when-to-meet-container" style={{ display: 'flex', gap: '20px' }}>
                            <TimeSelectionGrid
                                selectedDates={selectedDates}
                                start={start}
                                end={end}
                                selectedTimes={selectedTimes}
                                onSelectTimes={handleSelectTimes}
                                allData={remoteDetails}
                            />
                            {remoteForm && remoteDetails ? (
                                <AvailabilityMatrix form={remoteForm} details={remoteDetails} allData={remoteDetails} />
                            ) : (
                                <div style={{ padding: 20 }}>가용 시간 불러오는 중…</div>
                            )}
                        </div>
                        {/* ───────── navigation-buttons 영역 ───────── */}
                        <div className="navigation-buttons">
                            <button onClick={prevStep}>Back</button>
                            <button onClick={() => navigate('/schedule')}>Next</button>

                            {/* <button
                                disabled={!formId || isLoading}
                                onClick={() => uploadAvailability(formId)}
                            >
                                확정(가용 시간 업로드)
                            </button> */}
                            <button
                                disabled={isLoading}            // formId 체크 제거
                                onClick={() => {
                                    uploadAvailability(1);        // 🔹
                                    loadWhen2Meet(1);             // 다시 불러오기
                                }}
                            >
                                확정(가용 시간 업로드)
                            </button>


                            {isLoading && <div className="loading">로딩 중…</div>}
                            {error && <div className="error-message">{error}</div>}
                        </div>
                    </div>
                </>)
            }
        </div >
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
        //scheId: '',//스웨거에 생성할 때 생기는거라서 따로 전달해줄 필요 없음
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
                            <textarea
                                rows={2}
                                style={{ resize: 'none', height: '60px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}
                                value={newEvent.category}
                                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
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
