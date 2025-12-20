import { useNavigate, Link, useLocation } from "react-router-dom";
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import './schedule.css';
import MyCalendar from '../../components/Calendar/Calendar';
import WhenToMeetGrid from "./when2meet";
import ProjectSidebar from '../../components/SideBar/ProjectSidebar';
import '../../style/variables.css';
import '../../style/modern-theme-overhaul.css';

const API = 'https://teamplate-api.site';

async function fetchEventsApi({ projId, userId, currentDate, view }) {
    if (!projId || !userId) {
        throw new Error('Project ID 또는 User ID가 누락되었습니다.');
    }

    const cate = "meeting,task,plan";
    let standardDate;
    let endpoint;

    if (view === 'month') {
        endpoint = 'monthly';
        standardDate = moment(currentDate).startOf('month').format('YYYY-MM-DDTHH:mm:ss');
    } else { // 'week' 및 'day' 뷰는 weekly API 사용
        endpoint = 'weekly';
        standardDate = moment(currentDate).startOf('week').format('YYYY-MM-DDTHH:mm:ss');
    }

    const queryParams = new URLSearchParams({ projId, userId, standardDate, cate });
    const url = `${API}/schedule/check/${endpoint}?${queryParams}`;

    const res = await fetch(url);
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API 호출 실패: ${res.status} ${res.statusText} - ${errorText}`);
    }
    const data = await res.json();

    const teamList = data.teamSchedules?.[projId] || [];
    const formattedTeam = teamList.map((item, idx) => ({
        id: item.scheduleId || `team-${idx}`,
        title: item.scheduleName,
        start: new Date(item.date),
        end: new Date(new Date(item.date).getTime() + (60 * 60 * 1000)),
        resource: item,
        category: item.category || 'meeting',
    }));

    const taskList = data.taskSchedules?.[projId] || [];
    const formattedTask = taskList.map((item, idx) => ({
        id: item.taskId || `task-${idx}`,
        title: `[과제] ${item.projName} (${item.role})`,
        start: new Date(item.deadLine),
        end: new Date(new Date(item.deadLine).getTime() + (60 * 60 * 1000)),
        resource: item,
        category: 'task',
    }));

    return [...formattedTeam, ...formattedTask];
}

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

    const CustomToolbar = (toolbar) => {
        const goToBack = () => toolbar.onNavigate('PREV');
        const goToNext = () => toolbar.onNavigate('NEXT');
        const goToToday = () => toolbar.onNavigate('TODAY');

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
        const resource = event.resource || {};
        setPopupContent(
            `<div><strong>${event.title || '일정'}</strong></div>
             <div>시간: ${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}</div>
             <div>장소: ${resource.place || 'N/A'}</div>
             <div>카테고리: ${resource.category || 'N/A'}</div>`
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

    const exitWhenToMeet = () => {
        setWhenToMeet(false);
        // 일정 목록 새로고침
        fetchEvents();
    };

    // 일정 생성 API 연결
    const handleAddEvent = async (eventObject) => {
        const projId = currentProject;

        if (!eventObject.start || !eventObject.end) {
            return;
        }

        const start = new Date(eventObject.start);
        const end = new Date(eventObject.end);

        if (end <= start) {
            return;
        }


        // 참여자 문자열을 배열로 변환
        const participantsArray = (eventObject.attendees || '').split(',').map(p => p.trim());

        // API DTO에 맞게 페이로드 매핑
        const newEventPayload = {
            projId: projId,
            date: moment(eventObject.start).format('YYYY-MM-DDTHH:mm:ss'),
            scheName: eventObject.scheName,
            place: eventObject.location,
            category: eventObject.category,
            detail: eventObject.agenda,
            // 수정: 백엔드에서 JSON 배열을 직접 처리하므로 이중 stringify 방지
            participants: participantsArray
        };

        console.log("일정 등록 시도, 페이로드:", newEventPayload);

        try {
            const response = await fetch(`${API}/schedule/check/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEventPayload),
            });

            if (response.ok) {
                const savedEvent = await response.json();
                console.log("일정 등록 성공:", savedEvent);
                alert("일정이 등록되었습니다.");
                fetchEvents();
                setShowPopup(false);
            } else {
                const errorText = await response.text();
                console.error("일정 등록 실패 (서버 응답):", errorText);
                alert("일정 생성에 실패했습니다: " + errorText);
            }
        } catch (error) {
            console.error("일정 등록 실패 (네트워크/기타):", error);
            alert("서버와 연결할 수 없습니다.");
        }
    };

    // REFACTOR: fetchEvents를 useCallback으로 감싸고, 새 API 명세에 맞게 수정
    const fetchEvents = useCallback(async () => {
        if (!currentProject || !currentUser) {
            console.warn("Project ID 또는 User ID가 없습니다. API를 호출할 수 없습니다.");
            return;
        }
        console.log("일정 불러오기 시작:", { projId: currentProject, userId: currentUser, currentDate, view });
        setLoading(true);
        try {
            const result = await fetchEventsApi({ projId: currentProject, userId: currentUser, currentDate, view });
            console.log("일정 불러오기 성공:", result);
            setEvents(result || []);
        } catch (e) {
            console.error("API 호출 중 오류:", e.message || e);
            console.log("일정 불러오기 실패:", e);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [view, currentDate, currentProject, currentUser]);


    // 일정 조회 (주간/월간)
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const isTimeInvalid =
        !newEvent.start ||
        !newEvent.end ||
        new Date(newEvent.end) <= new Date(newEvent.start);

    const timeRangeInvalid =
        newEvent.start &&
        newEvent.end &&
        new Date(newEvent.end) <= new Date(newEvent.start);

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
                            <input
                                type="datetime-local"
                                value={newEvent.start}
                                onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                            />
                            <label>종료 시간:</label>
                            <input
                                type="datetime-local"
                                value={newEvent.end}
                                min={newEvent.start || undefined}
                                onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                            />
                            {timeRangeInvalid && (
                                <div className="form-error">종료 시간은 시작 시간 이후여야 합니다.</div>
                            )}
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

                            <input
                                type="text"
                                value={newEvent.agenda}
                                onChange={(e) => setNewEvent({ ...newEvent, agenda: e.target.value })}
                                placeholder="예: 프로젝트 진행 상황 논의"
                            />

                            <label>카테고리:</label>
                            <input
                                _ type="text"
                                value={newEvent.category}
                                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                placeholder="예: meeting, task"
                            />
                            <button onClick={() => handleAddEvent(newEvent)} className="add-event-button" disabled={isTimeInvalid}>
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
                        <div className="schedule-controls">
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
                    <WhenToMeetGrid
                        onExit={exitWhenToMeet}

                    />
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
