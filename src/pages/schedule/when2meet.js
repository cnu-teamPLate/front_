import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import moment from 'moment';
import './schedule.css';

const API_BASE_URL = 'https://teamplate-api.site';

// ===================================================================
//                        Utility Functions
// ===================================================================

/** "9:00 AM" => "09:00:00" 변환 */
const toHHMMSS = (timeStr) => {
    if (!timeStr) return '00:00:00';
    return moment(timeStr, 'h:mm A').format('HH:mm:ss');
};

/** * 사용자가 선택한 셀(문자열 배열)을 API 전송용 Range 배열로 변환 
 * ["2025-05-01-9:00 AM", ...] -> [{startDate: "...", endDate: "..."}, ...]
 */
const buildRangesFromSelectedTimes = (selectedTimes = []) => {
    if (!selectedTimes.length) return [];

    // 문자열 키를 Date 객체로 변환하여 정렬
    const parseCellKey = (key) => moment(`${key.slice(0, 10)} ${key.slice(11)}`, 'YYYY-MM-DD h:mm A').toDate();
    const sorted = [...selectedTimes].sort((a, b) => parseCellKey(a) - parseCellKey(b));

    const ranges = [];
    if (sorted.length === 0) return ranges;

    let rangeStart = parseCellKey(sorted[0]);
    let prev = rangeStart;

    for (let i = 1; i < sorted.length; i++) {
        const cur = parseCellKey(sorted[i]);
        // 15분 이상 차이가 나면 끊어진 구간으로 간주
        if ((cur - prev) / 60000 > 15) {
            ranges.push({
                startDate: moment(rangeStart).format('YYYY-MM-DDTHH:mm:ss'),
                endDate: moment(prev).add(15, 'minutes').format('YYYY-MM-DDTHH:mm:ss')
            });
            rangeStart = cur;
        }
        prev = cur;
    }
    // 마지막 구간 추가
    ranges.push({
        startDate: moment(rangeStart).format('YYYY-MM-DDTHH:mm:ss'),
        endDate: moment(prev).add(15, 'minutes').format('YYYY-MM-DDTHH:mm:ss')
    });

    return ranges;
};

// ===================================================================
//                  Sub-Components (Date Picker UI)
// ===================================================================

const DatePickerGrid = ({ year, month, selectedDates, onMouseDown, onMouseEnter, onMouseUp }) => {
    const days = useMemo(() => {
        const date = new Date(year, month, 1);
        const daysArray = [];
        const firstDay = date.getDay();
        for (let i = 0; i < firstDay; i++) daysArray.push(null);
        while (date.getMonth() === month) {
            daysArray.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return daysArray;
    }, [year, month]);
    const todayKey = moment().format('YYYY-MM-DD');
 return (
    <div className="date-picker-grid" onMouseUp={onMouseUp}>
      <div className="month-label">{year}년 {month + 1}월</div>
      <div className="weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="days">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} className="day-cell empty" />;

          const dateKey = moment(day).format('YYYY-MM-DD');
          const isSelected = selectedDates.includes(dateKey);
          const isToday = dateKey === todayKey; // ✅ 오늘 여부

          return (
            <div
              key={dateKey}
              className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onMouseDown={() => onMouseDown(dateKey)}
              onMouseEnter={() => onMouseEnter(dateKey)}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
const TwoMonthPicker = ({ selectedDates, onSelectDate }) => {
    const [baseDate, setBaseDate] = useState(new Date());
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState('select');

    const handleMouseDown = useCallback((dateKey) => {
        setIsDragging(true);
        const newDragMode = selectedDates.includes(dateKey) ? 'deselect' : 'select';
        setDragMode(newDragMode);
        onSelectDate(dateKey, newDragMode);
    }, [selectedDates, onSelectDate]);

    const handleMouseEnter = useCallback((dateKey) => {
        if (isDragging) onSelectDate(dateKey, dragMode);
    }, [isDragging, dragMode, onSelectDate]);

    useEffect(() => {
        const handleWindowMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => window.removeEventListener('mouseup', handleWindowMouseUp);
    }, []);

    const nextDate = useMemo(() => moment(baseDate).add(1, 'month').toDate(), [baseDate]);

    return (
        <div>
            <div className="schedule-controls" style={{ justifyContent: 'center' }}>
                <button onClick={() => setBaseDate(d => moment(d).subtract(1, 'month').toDate())}>이전</button>
                <button onClick={() => setBaseDate(new Date())}>오늘</button>
                <button onClick={() => setBaseDate(d => moment(d).add(1, 'month').toDate())}>다음</button>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <DatePickerGrid year={baseDate.getFullYear()} month={baseDate.getMonth()} selectedDates={selectedDates} onMouseDown={handleMouseDown} onMouseEnter={handleMouseEnter} onMouseUp={() => { }} />
                <DatePickerGrid year={nextDate.getFullYear()} month={nextDate.getMonth()} selectedDates={selectedDates} onMouseDown={handleMouseDown} onMouseEnter={handleMouseEnter} onMouseUp={() => { }} />
            </div>
        </div>
    );
};

// ===================================================================
//              Step 0: List View (투표 목록 보기)
// ===================================================================
const When2MeetList = ({ onCreateNew, onSelectForm, onBack }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { search } = useLocation();
    const projId = new URLSearchParams(search).get('projectId');

    // 1. 상태 판별 함수 (진행중 vs 마감)
    const getStatus = (item) => {
        if (!item.dates || item.dates.length === 0) return { label: '진행중', active: true };

        // 투표의 마지막 날짜 + 종료 시간 구하기
        const lastDateStr = item.dates[item.dates.length - 1].startDate;
        const endTimeStr = item.endTime;

        // 마감 시점 (Moment 객체)
        const deadline = moment(`${lastDateStr} ${endTimeStr}`, 'YYYY-MM-DD HH:mm:ss');
        const now = moment();

        if (now.isBefore(deadline)) {
            return { label: '진행중', active: true, className: 'status-badge active' };
        } else {
            return { label: '마감됨', active: false, className: 'status-badge closed' };
        }
    };

    useEffect(() => {
        const fetchList = async () => {
            if (!projId) return;
            try {
                const res = await fetch(`${API_BASE_URL}/schedule/meeting/view/when2meet-list?projId=${projId}`);
                if (res.ok) {
                    const data = await res.json();
                    const items = Array.isArray(data) ? data : (data.result || []);

                    // 정렬: 진행중인 것이 먼저 오도록
                    const sortedItems = items.sort((a, b) => {
                        const statusA = getStatus(a).active;
                        const statusB = getStatus(b).active;
                        return statusA === statusB ? 0 : statusA ? -1 : 1;
                    });

                    setList(sortedItems);
                }
            } catch (error) {
                console.error("목록 로드 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchList();
    }, [projId]);

    return (
        <div className="when2meet-list-step">
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={onBack} className="modern-button back-button">
                    ← 달력으로 돌아가기
                </button>
            </div>

            <h1>시간 조율 (When2Meet)</h1>
            <p className="subtitle">팀원들과 가능한 시간을 맞춰보세요.</p>

            <div className="list-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>목록을 불러오는 중...</div>
                ) : list.length === 0 ? (
                    <div className="empty-state">
                        <p>진행 중인 투표가 없습니다.</p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {list.map((item) => {
                            const status = getStatus(item);
                            const cardStyle = status.active ? {} : { opacity: 0.7, backgroundColor: '#f9f9f9' };

                            return (
                                <div
                                    key={item.formId}
                                    className="vote-card"
                                    onClick={() => onSelectForm(item.formId)}
                                    style={cardStyle}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <h3>{item.title}</h3>
                                        <span className={status.className}>{status.label}</span>
                                    </div>

                                    <div className="card-info">
                                        {item.dates && item.dates.length > 0 && (
                                            <span>📅 {moment(item.dates[0].startDate).format('MM/DD')} ~ {moment(item.dates[item.dates.length - 1]?.startDate).format('MM/DD')}</span>
                                        )}
                                        <span>⏰ {moment(item.startTime, 'HH:mm:ss').format('HH:mm')} - {moment(item.endTime, 'HH:mm:ss').format('HH:mm')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <button onClick={onCreateNew} className="modern-button primary create-new-btn">
                + 새 일정 만들기
            </button>
        </div>
    );
};

// ===================================================================
//                  Step 1: Create Form (폼 생성)
// ===================================================================
const CreateStep = ({ onFormCreated, onBack }) => {
    const [title, setTitle] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [startTime, setStartTime] = useState('9:00 AM');
    const [endTime, setEndTime] = useState('6:00 PM');
    const [isLoading, setIsLoading] = useState(false);
    const { search } = useLocation();
    const projId = new URLSearchParams(search).get('projectId');

    const handleDateSelect = useCallback((dateKey, mode) => {
        const todayKey = moment().format('YYYY-MM-DD');
        if (moment(dateKey).isBefore(todayKey, 'day')) return;

        setSelectedDates(prev => {
            const exists = prev.includes(dateKey);
            if (mode === 'select' && !exists) return [...prev, dateKey].sort();
            if (mode === 'deselect' && exists) return prev.filter(d => d !== dateKey);
            return prev;
        });
    }, []);

    const handleCreate = async () => {
        if (!title || selectedDates.length === 0 || !projId) {
            alert('회의 제목과 날짜를 모두 선택해주세요.');
            return;
        }
        setIsLoading(true);
        try {
            const payload = {
                title,
                projId,
                startTime: toHHMMSS(startTime),
                endTime: toHHMMSS(endTime),
                dates: selectedDates.map(d => ({ startDate: d, endDate: d }))
            };

            // 1. 생성 요청
            const createRes = await fetch(`${API_BASE_URL}/schedule/meeting/upload/when2meet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!createRes.ok) {
                const errData = await createRes.json();
                throw new Error(errData.message || '생성 실패');
            }

            // 2. ID 찾기 (서버가 ID를 안 줄 경우 목록 조회로 찾기)
            console.log("생성 성공, ID 조회를 위해 목록을 불러옵니다...");
            const listRes = await fetch(`${API_BASE_URL}/schedule/meeting/view/when2meet-list?projId=${projId}`);
            if (!listRes.ok) throw new Error('목록 조회 실패');

            const listData = await listRes.json();
            const forms = Array.isArray(listData) ? listData : (listData.result || []);

            // 제목이 같고 ID가 가장 큰(최신) 폼 찾기
            const createdForm = forms
                .filter(f => f.title === title)
                .sort((a, b) => b.formId - a.formId)[0];

            if (!createdForm) {
                throw new Error("생성된 일정을 목록에서 찾을 수 없습니다.");
            }

            console.log("찾은 ID:", createdForm.formId);
            onFormCreated(createdForm.formId);

        } catch (error) {
            console.error("생성 에러:", error);
            alert(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const timeOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => moment({ hour: i }).format('h:00 A')), []);

    return (
        <div className="when2meet-create-step">
            <button onClick={onBack} className="modern-button back-button">← 목록으로</button>
            <h1>새로운 시간 맞추기</h1>
            <div className="form-section"><label>회의 제목</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 2차 중간 점검 회의" /></div>
            <div className="form-section"><label>날짜 선택</label><TwoMonthPicker selectedDates={selectedDates} onSelectDate={handleDateSelect} /></div>
            <div className="form-section time-range-selector">
                <label>시간 범위</label>
                <div>
                    <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <span>~</span>
                    <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>{timeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
            </div>
            <button onClick={handleCreate} disabled={isLoading} className="modern-button primary submit-button">{isLoading ? '생성 중...' : '생성하고 시간 선택하기 →'}</button>
        </div>
    );
};

// ===================================================================
//                  Step 2: Vote & View (투표 및 결과 확인)
// ===================================================================

const VoteAndViewStep = ({ when2meetId, onBack }) => {
    const [formInfo, setFormInfo] = useState(null);
    const [availability, setAvailability] = useState({});
    const [mySelectedTimes, setMySelectedTimes] = useState([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 드래그 상태 관리
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState('select'); // 'select' or 'deselect'

    const { search } = useLocation();
    const userId = localStorage.getItem('userId');

    // 1. 데이터 불러오기 함수 (Refresh용)
    const fetchDetails = useCallback(async (showLoading = true) => {
        if (!when2meetId) return;

        if (showLoading) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/schedule/meeting/view/when2meet?when2meetId=${when2meetId}`);
            if (!response.ok) throw new Error('상세 정보 조회 실패');
            const data = await response.json();

            const details = data.details || {};
            const form = data.form || {};

            // 참여 유저 수 계산 (중복 제거)
            const userSet = new Set();
            Object.values(details).forEach(arr => arr.forEach(u => userSet.add(u.userId)));
            setTotalUsers(userSet.size);

            setFormInfo(form);
            setAvailability(details);
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [when2meetId]);

    // 초기 로딩
    useEffect(() => {
        fetchDetails(true);
    }, [fetchDetails]);

    // 2. 그리드 데이터 준비 (날짜, 시간 슬롯)
    const { dates, timeSlots } = useMemo(() => {
        if (!formInfo) return { dates: [], timeSlots: [] };

        // 날짜 정렬
        const rawDates = formInfo.dates ? formInfo.dates.map(d => d.startDate) : Object.keys(availability);
        const dates = rawDates.sort();

        // 시간 슬롯 생성 (15분 단위)
        const slots = [];
        const startStr = formInfo.startTime || "09:00:00";
        const endStr = formInfo.endTime || "18:00:00";
        let current = moment(startStr, 'HH:mm:ss');
        const end = moment(endStr, 'HH:mm:ss');

        while (current.isBefore(end)) {
            slots.push(current.format('h:mm A'));
            current.add(15, 'minutes');
        }
        return { dates, timeSlots: slots };
    }, [formInfo, availability]);

    // 3. 드래그 핸들러 (Painting Logic)
    const handleMouseDown = useCallback((cellKey) => {
        setIsDragging(true);
        const newDragMode = mySelectedTimes.includes(cellKey) ? 'deselect' : 'select';
        setDragMode(newDragMode);

        setMySelectedTimes(prev => {
            if (newDragMode === 'select' && !prev.includes(cellKey)) return [...prev, cellKey];
            if (newDragMode === 'deselect' && prev.includes(cellKey)) return prev.filter(k => k !== cellKey);
            return prev;
        });
    }, [mySelectedTimes]);

    const handleMouseEnter = useCallback((cellKey) => {
        if (!isDragging) return;
        setMySelectedTimes(prev => {
            const exists = prev.includes(cellKey);
            if (dragMode === 'select' && !exists) return [...prev, cellKey];
            if (dragMode === 'deselect' && exists) return prev.filter(k => k !== cellKey);
            return prev;
        });
    }, [isDragging, dragMode]);

    // 윈도우 전체에서 마우스를 뗐을 때 드래그 종료
    useEffect(() => {
        const handleWindowMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => window.removeEventListener('mouseup', handleWindowMouseUp);
    }, []);

    // 4. 제출 핸들러 (Re-fetch 적용)
    const handleSubmit = async () => {
        if (mySelectedTimes.length === 0) {
            alert('가능한 시간을 드래그하여 선택해주세요.');
            return;
        }
        setIsSubmitting(true);

        try {
            const payload = {
                when2meetId,
                details: [{ userId, dates: buildRangesFromSelectedTimes(mySelectedTimes) }]
            };

            const response = await fetch(`${API_BASE_URL}/schedule/meeting/upload/when2meet/detail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('제출 실패');

            alert('성공적으로 제출되었습니다!');
            // 화면 새로고침 없이 데이터만 갱신
            await fetchDetails(false);

        } catch (error) {
            alert(`오류: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!formInfo) return <div style={{ padding: '40px', textAlign: 'center' }}>데이터를 불러올 수 없습니다. <button onClick={onBack}>뒤로가기</button></div>;

    return (
        <div className="when2meet-vote-step">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={onBack} className="modern-button back-button">← 목록으로</button>
                {isRefreshing && <span style={{ fontSize: '0.8rem', color: '#666' }}>최신 정보 불러오는 중...</span>}
            </div>
            <h1>{formInfo.title}</h1>

            <div className="grids-container">
                {/* 왼쪽: 내 시간 선택 (드래그) */}
                <div>
                    <h3>내 시간 선택하기 (드래그)</h3>
                    <div className="time-grid" onMouseLeave={() => setIsDragging(false)}>
                        <div className="grid-header">
                            {dates.map(d => <div key={d} className="grid-cell date-label">{moment(d).format('MM/DD')}</div>)}
                        </div>
                        {timeSlots.map(time => (
                            <div key={time} className="grid-row" data-time={time}>
                                {dates.map(date => {
                                    const cellKey = `${date}-${time}`;
                                    const isSelected = mySelectedTimes.includes(cellKey);
                                    return (
                                        <div
                                            key={cellKey}
                                            className={`grid-cell selection-cell ${isSelected ? 'selected' : ''}`}
                                            onMouseDown={() => handleMouseDown(cellKey)}
                                            onMouseEnter={() => handleMouseEnter(cellKey)}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 오른쪽: 종합 결과 (히트맵) */}
                <div>
                    <h3>팀원 응답 현황 ({totalUsers}명)</h3>
                    <div className="time-grid">
                        <div className="grid-header">
                            {dates.map(d => <div key={d} className="grid-cell date-label">{moment(d).format('MM/DD')}</div>)}
                        </div>
                        {timeSlots.map(time => (
                            <div key={time} className="grid-row" data-time={time}>
                                {dates.map(date => {
                                    // 이 시간대에 가능한 유저 필터링
                                    const availableUsers = availability[date]?.filter(avail => {
                                        const slotStart = moment(time, 'h:mm A');
                                        const availStart = moment(avail.startTime, 'HH:mm:ss');
                                        const availEnd = moment(avail.endTime, 'HH:mm:ss');
                                        return slotStart.isBetween(availStart, availEnd, undefined, '[)');
                                    }) || [];

                                    const count = availableUsers.length;
                                    const opacity = totalUsers > 0 ? count / totalUsers : 0;
                                    const userNames = availableUsers.map(u => u.username).join(', ');

                                    return (
                                        <div
                                            key={`${date}-${time}`}
                                            className="grid-cell heatmap-cell"
                                            title={count > 0 ? `${count}/${totalUsers}명 가능: ${userNames}` : '가능한 인원 없음'}
                                            style={{
                                                backgroundColor: `rgba(72, 187, 120, ${opacity})` // Green Heatmap
                                            }}
                                        >
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button onClick={handleSubmit} disabled={isSubmitting} className="modern-button primary submit-button">
                    {isSubmitting ? '제출 중...' : '내 시간 제출하기'}
                </button>
            </div>
        </div>
    );
};

// ===================================================================
//                  Main Container
// ===================================================================

const WhenToMeetGrid = ({ onExit, initialWhen2meetId }) => {
    const [step, setStep] = useState(initialWhen2meetId ? 'vote' : 'list');
    const [selectedId, setSelectedId] = useState(initialWhen2meetId || null);

    const goCreate = () => {
        setStep('create');
    };

    const goVote = (id) => {
        setSelectedId(id);
        setStep('vote');
    };

    const goBackToList = () => {
        setSelectedId(null);
        setStep('list');
    };

    const handleFormCreated = (newId) => {
        setSelectedId(newId);
        setStep('vote');
    };

    // 달력으로 돌아가기 (onExit 호출)
    const goBackFromList = () => {
        if (onExit) onExit();
    };

    return (
        <div className="when2meet-container">
            {step === 'list' && (
                <When2MeetList
                    onCreateNew={goCreate}
                    onSelectForm={goVote}
                    onBack={goBackFromList}
                />
            )}

            {step === 'create' && (
                <CreateStep
                    onFormCreated={handleFormCreated}
                    onBack={goBackToList}
                />
            )}

            {step === 'vote' && (
                <VoteAndViewStep
                    when2meetId={selectedId}
                    onBack={goBackToList}
                />
            )}
        </div>
    );
};

export default WhenToMeetGrid;