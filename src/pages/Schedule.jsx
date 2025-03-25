import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import axios from 'axios';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import Swal from 'sweetalert2';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Header from '../components/include/Header';
import './Schedule.css';

// Localizer 설정
const localizer = momentLocalizer(moment);

// Drag and Drop 캘린더
const DnDCalendar = withDragAndDrop(Calendar);

// Styled Components로 캘린더 스타일링
const StyledCalendar = styled(Calendar)`
  .rbc-event {
    background-color: #209696; /* 이벤트 배경 색상 */
    color: white;
    border-radius: 4px;
    transition: background-color 0.3s ease;
    &:hover {
      background-color: #1a8c8c; /* 마우스 오버 시 색상 변경 */
    }
  }
  .rbc-day-bg {
    background-color: #f0f8ff; /* 날짜 배경 색상 */
  }
  .rbc-today {
    background-color: #e0f7fa; /* 오늘 날짜 강조 */
  }
  .rbc-time-slot {
    border-left: 2px solid #209696; /* 시간 슬롯 경계선 */
  }
`;

// Axios 인스턴스 설정 (백엔드와의 통신을 위한 기본 설정)
const instance = axios.create({
  baseURL: 'http://localhost:8000', // 백엔드 서버 주소
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 인증 추가 (JWT 토큰 사용 시 필요)
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // JWT 토큰 가져오기
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const Schedule = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [todayPlan, setTodayPlan] = useState([]);
  const [events, setEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [supplements, setSupplements] = useState([]);
  const [selectedSupplement, setSelectedSupplement] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [memo, setMemo] = useState('');

  // 상태별 색상 클래스
  const getStatusClass = (status) => {
    switch (status) {
      case '완료':
        return 'bg-green-200';
      case '미완료':
        return 'bg-red-200';
      case '예정':
        return 'bg-gray-200';
      default:
        return '';
    }
  };

  // -------------------------
  // 1. 데이터 초기화 및 로딩
  // -------------------------
  
  // 계정 유형 확인 (소셜 계정 여부)
  const checkAccountType = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await instance.get('/api/member/account-type');
    } catch (error) {
      console.error('계정 유형 확인 오류:', error);
    }
  };

  // 주간 계획 조회 (백엔드 엔드포인트: /api/weekly-plan)
  const fetchWeeklyPlan = async () => {
    try {
      const response = await instance.get('/api/weekly-plan');
      setWeeklyPlan(response.data);
    } catch (error) {
      console.error('Error fetching weekly plan:', error);
    }
  };

  // 오늘의 계획 조회 (백엔드 엔드포인트: /api/today-plan)
  const fetchTodayPlan = async () => {
    try {
      const response = await instance.get('/api/today-plan');
      setTodayPlan(response.data);
    } catch (error) {
      console.error('Error fetching today plan:', error);
    }
  };

  // 이벤트 목록 조회 (백엔드 엔드포인트: /api/events)
  const fetchEvents = async () => {
    try {
      const response = await instance.get('/api/events');
      const formattedEvents = response.data.map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // 영양제 목록 조회 (백엔드 엔드포인트: /api/supplements)
  const fetchSupplements = async () => {
    try {
      const response = await instance.get('/api/supplements');
      setSupplements(response.data);
    } catch (error) {
      console.error('Error fetching supplements:', error);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로딩
  useEffect(() => {
    checkAccountType();
    fetchWeeklyPlan();
    fetchTodayPlan();
    fetchEvents();
    fetchSupplements();
  }, []);

  // -------------------------
  // 🟩 테스트용 데이터 시작
  // -------------------------
  useEffect(() => {
    if (events.length === 0) {
      // 테스트용 이벤트 데이터
      const testEvents = [
        {
          id: 1,
          title: '영양제 복용 - 비타민 C',
          start: new Date(2025, 2, 24, 8, 0), // 2025년 3월 24일 오전 8시
          end: new Date(2025, 2, 27, 8, 30), // 2025년 3월 24일 오전 8시 30분
          allDay: false,
        },
        {
          id: 2,
          title: '운동 스케줄',
          start: new Date(2025, 2, 24, 18, 0), // 2025년 3월 24일 오후 6시
          end: new Date(2025, 2, 24, 19, 0), // 2025년 3월 24일 오후 7시
          allDay: false,
        },
        {
          id: 3,
          title: '회의 참석',
          start: new Date(2025, 2, 25, 10, 0), // 2025년 3월 25일 오전 10시
          end: new Date(2025, 2, 25, 11, 0), // 2025년 3월 25일 오전 11시
          allDay: false,
        },
      ];
      setEvents(testEvents); // 테스트 데이터 설정
    }
  }, [events]);
  // -------------------------
  // 🟩 테스트용 데이터 끝
  // -------------------------

  // -------------------------
  // 2. 복용 일정 관련 기능
  // -------------------------
  // 이벤트 드래그 앤 드롭 처리
  const moveEvent = ({ event, start, end }) => {
    const updatedEvents = events.map((existingEvent) =>
      existingEvent.id === event.id ? { ...existingEvent, start, end } : existingEvent
    );
    setEvents(updatedEvents);
    // 백엔드 업데이트 (엔드포인트: PUT /api/events/:id)
    try {
      instance.put(`/api/events/${event.id}`, { ...event, start, end });
    } catch (error) {
      console.error('이벤트 업데이트 중 오류:', error);
    }
  };

  // 이벤트 크기 조절 처리
  const resizeEvent = ({ event, start, end }) => {
    const updatedEvents = events.map((existingEvent) =>
      existingEvent.id === event.id ? { ...existingEvent, start, end } : existingEvent
    );
    setEvents(updatedEvents);
    // 백엔드 업데이트 (엔드포인트: PUT /api/events/:id)
    try {
      instance.put(`/api/events/${event.id}`, { ...event, start, end });
    } catch (error) {
      console.error('이벤트 크기 조절 중 오류:', error);
    }
  };

  // 이벤트 추가
  const handleAddEvent = async () => {
    if (!newEventTitle) return;
    const newEvent = {
      title: newEventTitle,
      start: date,
      end: new Date(date.getTime() + 3600 * 1000), // 1시간 이후로 설정
      allDay: false,
    };
    try {
      const response = await instance.post('/api/events', newEvent); // 백엔드 엔드포인트: POST /api/events
      setEvents([...events, response.data]);
      setNewEventTitle('');
    } catch (error) {
      alert('이벤트 추가 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (event) => {
    try {
      await instance.delete(`/api/events/${event.id}`); // 백엔드 엔드포인트: DELETE /api/events/:id
      setEvents(events.filter((e) => e.id !== event.id));
    } catch (error) {
      alert('이벤트 삭제 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  // -------------------------
  // 3. 복용 기록 입력
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplement || !selectedTime) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    try {
      await instance.post('/api/records', { // 백엔드 엔드포인트: POST /api/records
        supplement: selectedSupplement,
        time: selectedTime,
        memo,
      });
      alert('복용 기록이 저장되었습니다.');
      setSelectedSupplement('');
      setSelectedTime('');
      setMemo('');
    } catch (error) {
      console.error('복용 기록 저장 중 오류:', error);
    }
  };

  // -------------------------
  // 4. 알림 기능
  // -------------------------
  useEffect(() => {
    const scheduleNotifications = () => {
      todayPlan.forEach((item) => {
        const now = new Date();
        const eventTime = new Date(now.toDateString() + ' ' + item.time);
        const timeDiff = eventTime - now;
        if (timeDiff > 0 && timeDiff < 86400000) {
          setTimeout(() => {
            Swal.fire({
              title: `${item.supplement} 복용 시간입니다!`,
              text: `지금 ${item.supplement}을(를) 복용하세요.`,
              icon: 'info',
              confirmButtonText: '확인',
            });
          }, timeDiff);
        }
      });
    };
    scheduleNotifications();
  }, [todayPlan]);

  // -------------------------
  // 5. UI 렌더링
  // -------------------------
  return (
    <div className="bg-gray-50 font-['Noto_Sans_KR']">
      {/* 헤더 */}
      <Header />
      
      {/* 메인 콘텐츠 */}
      <main className="p-6 mt-4 container mx-auto">
        <div className="max-w-7xl mx-auto">
          {/* 오늘의 영양제 */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">오늘의 영양제</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white shadow rounded-lg p-5 flex items-center">
              <i className="fas fa-sun text-yellow-400 text-2xl"></i>
              <div className="ml-3">
                <h4 className="text-lg font-medium text-gray-900">아침</h4>
                {todayPlan.filter(item => item.time === '아침').map((item, index) => (
                  <p key={index} className="text-sm text-gray-900">{item.supplement}</p>
                ))}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-5 flex items-center">
              <i className="fas fa-cloud-sun text-orange-400 text-2xl"></i>
              <div className="ml-3">
                <h4 className="text-lg font-medium text-gray-900">점심</h4>
                {todayPlan.filter(item => item.time === '점심').map((item, index) => (
                  <p key={index} className="text-sm text-gray-900">{item.supplement}</p>
                ))}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-5 flex items-center">
              <i className="fas fa-moon text-blue-500 text-2xl"></i>
              <div className="ml-3">
                <h4 className="text-lg font-medium text-gray-900">저녁</h4>
                {todayPlan.filter(item => item.time === '저녁').map((item, index) => (
                  <p key={index} className="text-sm text-gray-900">{item.supplement}</p>
                ))}
              </div>
            </div>
          </div>
          
          {/* 주간 복용 계획 */}
          <div className="bg-white shadow rounded-lg p-5 mb-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📅 주간 복용 계획</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 text-center">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = new Date();
                day.setDate(day.getDate() - day.getDay() + i + 1);
                const status = weeklyPlan[day.toLocaleDateString('en-US', { weekday: 'long' })]?.status || '미완료';
                return (
                  <div key={i} className={`p-3 border rounded-lg cursor-pointer ${getStatusClass(status)}`}>
                    <p className="text-sm font-semibold">{day.toLocaleDateString('ko-KR', { weekday: 'short' })}</p>
                    <p className="text-xs text-gray-600">{day.toLocaleDateString()}</p>
                    <ul className="mt-1 text-xs text-gray-700">
                      {weeklyPlan[day.toLocaleDateString('en-US', { weekday: 'long' })]?.items?.map((item, j) => (
                        <li key={j}>✅ {item}</li>
                      )) || <li>❌ 없음</li>}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 복용 일정 캘린더 */}
          <div className="mt-4 p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">복용 일정</h2>
            <div style={{ height: 500 }}>
              <StyledCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                onSelectSlot={(slotInfo) => setDate(slotInfo.start)}
                onEventDrop={moveEvent}
                onEventResize={resizeEvent}
                selectable={true}
                resizable={true}
                droppable={true}
                components={{
                  event: (props) => (
                    <div
                      {...props}
                      className="bg-teal-500 text-white p-2 rounded cursor-pointer hover:bg-teal-600 flex items-center justify-between"
                    >
                      <span>{props.event.title}</span>
                      <button onClick={() => handleDeleteEvent(props.event)} className="text-red-500 ml-2">
                        ×
                      </button>
                    </div>
                  ),
                }}
              />
            </div>
            <div className="mt-4">
              <input
                type="text"
                placeholder="새로운 이벤트 제목"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="border rounded-md p-2 mr-2"
              />
              <button
                onClick={handleAddEvent}
                className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600"
              >
                이벤트 추가
              </button>
            </div>
            <p className="mt-4 text-gray-900">선택한 날짜: {date.toLocaleDateString()}</p>
          </div>
          
          {/* 복용 기록 입력 */}
          <div className="mt-4 p-4 bg-white shadow rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">복용 기록 입력</h2>
            <form onSubmit={handleSubmit}>
              <div className="md:flex md:justify-between mb-4">
                <label htmlFor="supplement" className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  영양제 선택
                </label>
                <select
                  id="supplement"
                  value={selectedSupplement}
                  onChange={(e) => setSelectedSupplement(e.target.value)}
                  className="border rounded-md p-2 w-full md:w-3/4"
                >
                  <option value="">선택하세요</option>
                  {supplements.map((supplement) => (
                    <option key={supplement.id} value={supplement.name}>
                      {supplement.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:flex md:justify-between mb-4">
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  복용 시간
                </label>
                <input
                  type="time"
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="border rounded-md p-2 w-full md:w-3/4"
                />
              </div>
              <div className="md:flex md:justify-between mb-4">
                <label htmlFor="memo" className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  메모
                </label>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="border rounded-md p-2 w-full md:w-3/4"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600"
                >
                  기록 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Schedule;