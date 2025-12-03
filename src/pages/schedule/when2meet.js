import { useNavigate, Link, useLocation } from "react-router-dom";
import React, { useMemo, useState, useEffect } from 'react';
import moment from 'moment';
import './schedule.css';
// 파일 맨 위쪽
const API = 'https://www.teamplate-api.site';
// --- state 선언들 바로 아래 ---
// 파일 상단 (컴포넌트 밖) — Hook 대신 즉시 변환
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
    const selectedDates = form.dates.map(d => d.startDate);  // ["2025-05-27", …]
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
        const currentUsername = "";

        const body = {
            when2meetId,
            details: [{
                userId: currentUserId,
                username: currentUsername,
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
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || `HTTP ${res.status}`);
            }
            alert(data.message || '가용 시간이 업로드되었습니다.');
            return true;
        } catch (e) {
            console.error('uploadAvailability 실패', e);
            setError(e.message || '업로드 실패');
            return false;
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
    const [lastLoadFailedId, setLastLoadFailedId] = useState(null); // remember failed loads to avoid retries

    const loadWhen2Meet = async (id) => {
        if (!id) return;
        // Avoid hammering the backend if we've already failed for this id
        if (lastLoadFailedId === id) {
            // ensure there is at least a minimal fallback so UI can render
            if (!remoteForm) {
                const fallbackForm = {
                    title: eventTitle || 'Untitled',
                    startTime: toHHMMSS(start),
                    endTime: toHHMMSS(end),
                    dates: selectedDates.map(d => ({ startDate: d, endDate: d }))
                };
                setRemoteForm(fallbackForm);
            }
            if (!remoteDetails) {
                const fd = {};
                selectedDates.forEach(d => { fd[d] = []; });
                setRemoteDetails(fd);
            }
            return;
        }

        setIsLoading(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
        try {
            const res = await fetch(`${API}/schedule/meeting/view/when2meet?when2meetId=${id}`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`HTTP ${res.status} ${text}`);
            }
            const json = await res.json();
            setRemoteForm(json.form || null);
            setRemoteDetails(json.details || null);
            console.log("웬투밋 호출 결과", json.details);
            setLastLoadFailedId(null);
        } catch (e) {
            console.error('view API 실패', e);
            setError('서버에 연결할 수 없습니다. 오프라인 모드로 표시합니다.');
            setLastLoadFailedId(id);
            // minimal fallback so UI can function
            const fallbackForm = {
                title: eventTitle || 'Untitled',
                startTime: toHHMMSS(start),
                endTime: toHHMMSS(end),
                dates: selectedDates.map(d => ({ startDate: d, endDate: d }))
            };
            const fd = {};
            selectedDates.forEach(d => { fd[d] = []; });
            setRemoteForm(fallbackForm);
            setRemoteDetails(fd);
        } finally {
            clearTimeout(timeout);
            setIsLoading(false);
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

    // 유틸: "h:mm AM/PM" 문자열 생성
    const generateTimeOptions = (interval = 60) => {
        const times = [];
        const start = new Date(2000, 0, 1, 0, 0);   // 00:00
        const end = new Date(2000, 0, 1, 23, 59);  // 23:59
        let cur = new Date(start);

        while (cur <= end) {
            let h = cur.getHours();
            const m = cur.getMinutes();
            const ampm = h >= 12 ? "PM" : "AM";
            h = h % 12;
            if (h === 0) h = 12;
            const label = `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
            times.push(label);

            cur = new Date(cur.getTime() + interval * 60000); // interval 분 단위 증가
        }
        return times;
    };


    return (
        <div className="new-event-container">
            {step === 1 && (
                <>
                    <div className="step-container">
                        <button className="back" onClick={onExit}>
                            뒤로 가기
                        </button>                        <h1>Create New Event</h1>
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
                                    {generateTimeOptions(60).map((time) => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                No later than:
                                <select value={end} onChange={(e) => setLatestTime(e.target.value)}>
                                    {generateTimeOptions(60).map((time) => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="navigation-buttons">
                            <button
                                onClick={async () => {
                                    /* ① 입력 검증 */
                                    if (!validateStep()) return;

                                    /* ② 폼 생성 → id */

                                    const id = await handleCreatewhen2meet();


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
                        <button className="back" onClick={onExit}>
                            홈으로 가기
                        </button>                           <div className="when-to-meet-container" style={{ display: 'flex', gap: '20px' }}>
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
                                disabled={isLoading}
                                onClick={async () => {
                                    const id = formId || 1; // placeholder id if formId not set
                                    const ok = await uploadAvailability(id);
                                    if (ok) {
                                        await loadWhen2Meet(id);
                                    }
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

/* 6) Schedule 메인 컴포넌트 */
const When2meet = () => {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const currentProject = urlParams.get("projectId");
    const currentUser = localStorage.getItem("userId");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [whenToMeet, setWhenToMeet] = useState(false);
    // onExit 함수는 WhenToMeetGrid에서 onExit prop으로 전달됨
    const exitWhenToMeet = () => {
        setWhenToMeet(false);
    };


    return (
        <div className="board">
            <aside className={`App-sidebar ${sidebarOpen ? 'open' : ''}`}>
            </aside>

            <div className="calender-container">

                <WhenToMeetGrid onExit={exitWhenToMeet} />

            </div>


        </div>
    );
};
export default WhenToMeetGrid;
export { AvailabilityMatrix, TimeSelectionGrid };

// --------------------------------------------------------------------
// API helpers exported for reuse in schedule.js
// --------------------------------------------------------------------
export async function fetchEventsApi({ projId, userId, currentDate, view }) {
    if (!projId || !userId) {
        throw new Error('projId or userId missing');
    }

    const standardDate = moment(currentDate).format('YYYY-MM-DDTHH:mm:ss');
    const cate = "meeting,task";
    const viewType = (view === 'month') ? 'monthly' : 'weekly';
    const q = `projId=${encodeURIComponent(projId)}&userId=${encodeURIComponent(userId)}&standardDate=${encodeURIComponent(standardDate)}&cate=${encodeURIComponent(cate)}`;
    const url = `${API}/schedule/check/${viewType}?${q}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`API 호출 실패: ${res.status} ${res.statusText}`);
    }
    const body = await res.json();

    const newEvents = [];

    const team = body.teamSchedules?.[projId] || [];
    for (const s of team) {
        newEvents.push({
            id: s.scheduleId,
            title: s.scheduleName || '일정',
            start: new Date(s.date),
            end: moment(s.date).add(1, 'hour').toDate(),
            allDay: false,
            category: s.category,
            place: s.place,
            raw: s
        });
    }

    const tasks = body.taskSchedules?.[projId] || [];
    for (const t of tasks) {
        newEvents.push({
            id: `task_${t.taskId}`,
            title: t.role ? `[마감] ${t.role}` : '[마감] 과제',
            start: new Date(t.deadLine),
            end: new Date(t.deadLine),
            allDay: true,
            isTask: true,
            raw: t
        });
    }

    return newEvents;
}

export async function fetchAvailabilityApi(when2meetId) {
    if (!when2meetId) return null;
    try {
        const url = `${API}/schedule/meeting/adjust/availability?when2meetId=${when2meetId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch (e) {
        console.error('fetchAvailabilityApi 실패', e);
        return null;
    }
}
