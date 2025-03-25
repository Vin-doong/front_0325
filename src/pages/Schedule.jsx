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
import { searchProducts } from '../services/api';

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
  const [memo, setMemo] = useState('');
  
  // 새로 추가된 상태 변수들
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [intakeDistance, setIntakeDistance] = useState('');
  const [customIntakeDistance, setCustomIntakeDistance] = useState('');
  const [intakeTimes, setIntakeTimes] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 복용 시간대 토글 함수
  const toggleIntakeTime = (time) => {
    if (intakeTimes.includes(time)) {
      setIntakeTimes(intakeTimes.filter(t => t !== time));
    } else {
      setIntakeTimes([...intakeTimes, time]);
    }
  };

  // 제품 검색 함수
  const handleProductSearch = async (e) => {
    const searchTerm = e.target.value;
    setProductSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setProductResults([]);
      return;
    }
    
    try {
      const response = await searchProducts(searchTerm);
      // API 응답 구조에 따라 조정 필요
      if (response.data && response.data.data) {
        setProductResults(response.data.data);
      } else if (Array.isArray(response.data)) {
        setProductResults(response.data);
      } else {
        setProductResults([]);
      }
    } catch (error) {
      console.error('제품 검색 오류:', error);
      setProductResults([]);
    }
  };

  // 제품 선택 함수
  const selectProduct = (product) => {
    setSelectedProduct(product);
    setProductSearch(product.productName);
    setProductResults([]);
  };

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
      // 실제 API 구현 시 아래 코드 사용
      // const startOfWeek = new Date();
      // startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // 월요일 기준
      
      // const endOfWeek = new Date(startOfWeek);
      // endOfWeek.setDate(endOfWeek.getDate() + 6); // 일요일
      
      // const response = await instance.get('/api/schedules/weekly', {
      //   params: {
      //     startDate: startOfWeek.toISOString().split('T')[0],
      //     endDate: endOfWeek.toISOString().split('T')[0]
      //   }
      // });
      
      // 테스트용 더미 데이터
      const dummyWeeklyPlan = {
        Monday: { items: ['비타민 C', '오메가-3'], status: '완료' },
        Tuesday: { items: ['칼슘', '비타민 D'], status: '예정' },
        Wednesday: { items: ['마그네슘'], status: '예정' },
        Thursday: { items: ['유산균'], status: '예정' },
        Friday: { items: ['아연', '철분'], status: '예정' },
        Saturday: { items: ['종합비타민'], status: '예정' },
        Sunday: { items: ['오메가-3'], status: '예정' },
      };
      
      setWeeklyPlan(dummyWeeklyPlan);
    } catch (error) {
      console.error('주간 계획 조회 중 오류:', error);
    }
  };

  // 오늘의 계획 조회 (백엔드 엔드포인트: /api/today-plan)
  const fetchTodayPlan = async () => {
    try {
      // 실제 API 구현 시 아래 코드 사용
      // const today = new Date().toISOString().split('T')[0];
      // const response = await instance.get('/api/schedules/daily', {
      //   params: { date: today }
      // });
      
      // 테스트용 더미 데이터
      const dummyTodayPlan = [
        { supplement: '비타민 C', time: '아침', id: 1 },
        { supplement: '오메가-3', time: '아침', id: 2 },
        { supplement: '칼슘', time: '점심', id: 3 },
        { supplement: '마그네슘', time: '저녁', id: 4 },
      ];
      
      setTodayPlan(dummyTodayPlan);
    } catch (error) {
      console.error('오늘의 계획 조회 중 오류:', error);
    }
  };

  // 이벤트 목록 조회 (백엔드 엔드포인트: /api/events)
  const fetchEvents = async () => {
    try {
      // 실제 API 구현 시 아래 코드 사용
      // const response = await instance.get('/api/schedules');
      // const formattedEvents = response.data.map((schedule) => {
      //   // 각 스케줄에 대해 모든 복용 시간대별로 이벤트 생성
      //   return schedule.intakeTimes.map(time => {
      //     let hours = 8; // 기본값 (아침)
      //     if (time === '점심') hours = 12;
      //     if (time === '저녁') hours = 19;
          
      //     const start = new Date(schedule.intakeStart);
      //     start.setHours(hours, 0, 0);
          
      //     const end = new Date(start);
      //     end.setMinutes(start.getMinutes() + 30);
          
      //     return {
      //       id: `${schedule.scheduleId}_${time}`,
      //       title: `${schedule.productName} - ${time}`,
      //       start,
      //       end,
      //       allDay: false,
      //     };
      //   });
      // }).flat();
      
      // 테스트용 더미 데이터
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      
      const dummyEvents = [
        {
          id: 1,
          title: '비타민 C - 아침',
          start: new Date(today.setHours(8, 0, 0)),
          end: new Date(today.setHours(8, 30, 0)),
          allDay: false,
        },
        {
          id: 2,
          title: '오메가-3 - 아침',
          start: new Date(today.setHours(8, 0, 0)), 
          end: threeMonthsLater, 
          allDay: false,
        },
        {
          id: 3,
          title: '칼슘 - 점심',
          start: new Date(today.setHours(12, 0, 0)),
          end: new Date(today.setHours(12, 30, 0)),
          allDay: false,
        },
      ];
      
      setEvents(dummyEvents);
    } catch (error) {
      console.error('이벤트 목록 조회 중 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로딩
  useEffect(() => {
    checkAccountType();
    fetchWeeklyPlan();
    fetchTodayPlan();
    fetchEvents();
  }, []);

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
    if (!productSearch) {
      alert('영양제를 선택해주세요.');
      return;
    }
    
    if (intakeTimes.length === 0) {
      alert('복용 시간대를 선택해주세요.');
      return;
    }
    
    // 종료일이 없으면 시작일 + 30일로 설정
    const finalEndDate = endDate || (() => {
      const calcEndDate = new Date(startDate);
      calcEndDate.setDate(calcEndDate.getDate() + 30);
      return calcEndDate.toISOString().split('T')[0];
    })();
    
    // 복용 간격 계산
    const distance = intakeDistance === 'custom' ? 
      parseInt(customIntakeDistance) : 
      intakeDistance ? parseInt(intakeDistance) : 30;
    
    try {
      // 백엔드 저장 API 호출
      // 실제 백엔드 연동 시 아래 코드 사용
      // await instance.post('/api/schedules', {
      //   prdId: selectedProduct?.prdId || null,
      //   productName: productSearch,
      //   intakeStart: startDate,
      //   intakeDistance: distance,
      //   intakeEnd: finalEndDate,
      //   intakeTimes: intakeTimes,
      //   memo: memo
      // });
      
      // 캘린더에 이벤트 추가
      const newEvents = intakeTimes.map((time, index) => {
        let hours;
        switch (time) {
          case '아침': hours = 8; break;
          case '점심': hours = 12; break;
          case '저녁': hours = 19; break;
          default: hours = 8;
        }
        
        const start = new Date(startDate);
        start.setHours(hours, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 30);
        
        return {
          id: Date.now() + index,
          title: `${productSearch} - ${time}`,
          start,
          end,
          allDay: false
        };
      });
      
      setEvents([...events, ...newEvents]);
      
      // 주간 계획 업데이트
      const updatedPlan = { ...weeklyPlan };
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      daysOfWeek.forEach(day => {
        if (!updatedPlan[day]) {
          updatedPlan[day] = { items: [], status: '미완료' };
        }
        
        // 선택한 제품이 아직 해당 요일에 없으면 추가
        if (!updatedPlan[day].items.includes(productSearch)) {
          updatedPlan[day].items.push(productSearch);
          updatedPlan[day].status = '예정';
        }
      });
      
      setWeeklyPlan(updatedPlan);
      
      // 오늘의 계획 업데이트
      const today = new Date().toISOString().split('T')[0];
      if (startDate <= today && finalEndDate >= today) {
        const todayUpdates = intakeTimes.map(time => ({
          supplement: productSearch,
          time,
          id: Date.now() + Math.random()
        }));
        
        setTodayPlan([...todayPlan, ...todayUpdates]);
      }
      
      alert('복용 일정이 등록되었습니다.');
      
      // 폼 초기화
      setProductSearch('');
      setSelectedProduct(null);
      setIntakeTimes([]);
      setMemo('');
      
    } catch (error) {
      console.error('일정 등록 중 오류:', error);
      alert('일정 등록 중 오류가 발생했습니다.');
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (event) => {
    try {
      // await instance.delete(`/api/events/${event.id}`); // 백엔드 엔드포인트: DELETE /api/events/:id
      setEvents(events.filter((e) => e.id !== event.id));
      alert('일정이 삭제되었습니다.');
    } catch (error) {
      alert('이벤트 삭제 중 오류가 발생했습니다.');
      console.error(error);
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
                const weekday = day.toLocaleDateString('en-US', { weekday: 'long' });
                const status = weeklyPlan[weekday]?.status || '미완료';
                return (
                  <div key={i} className={`p-3 border rounded-lg cursor-pointer ${getStatusClass(status)}`}>
                    <p className="text-sm font-semibold">{day.toLocaleDateString('ko-KR', { weekday: 'short' })}</p>
                    <p className="text-xs text-gray-600">{day.toLocaleDateString()}</p>
                    <ul className="mt-1 text-xs text-gray-700">
                      {weeklyPlan[weekday]?.items?.map((item, j) => (
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
          </div>
          
          {/* 복용 일정 등록 (통합된 폼) */}
          <div className="mt-4 p-4 bg-white shadow rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">복용 일정 등록</h2>
            <form>
              {/* 영양제 선택 필드 */}
              <div className="md:flex md:justify-between mb-4">
                <label htmlFor="supplement" className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  영양제 선택
                </label>
                <div className="relative w-full md:w-3/4">
                  <input
                    type="text"
                    id="supplementSearch"
                    value={productSearch}
                    onChange={handleProductSearch}
                    placeholder="영양제 이름을 검색하거나 직접 입력하세요"
                    className="border rounded-md p-2 w-full"
                  />
                  {productResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {productResults.map((product) => (
                        <div 
                          key={product.prdId} 
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectProduct(product)}
                        >
                          {product.productName} ({product.companyName || '직접 입력'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 복용 시작일 */}
              <div className="md:flex md:justify-between mb-4">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  복용 시작일
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border rounded-md p-2 w-full md:w-3/4"
                />
              </div>

              {/* 복용 기간 설정 */}
              <div className="md:flex md:justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  복용 기간
                </label>
                <div className="w-full md:w-3/4 flex items-center space-x-2">
                  <select
                    value={intakeDistance}
                    onChange={(e) => {
                      setIntakeDistance(e.target.value);
                      // 시작일과 복용 기간으로 종료일 자동 계산
                      if (startDate && e.target.value && e.target.value !== 'custom') {
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + parseInt(e.target.value));
                        setEndDate(endDate.toISOString().split('T')[0]);
                      }
                    }}
                    className="border rounded-md p-2 flex-1"
                  >
                    <option value="">기간 선택</option>
                    <option value="30">30일</option>
                    <option value="60">60일</option>
                    <option value="90">90일</option>
                    <option value="180">180일</option>
                    <option value="365">1년</option>
                    <option value="custom">직접 입력</option>
                  </select>
                  {intakeDistance === 'custom' && (
                    <input
                      type="number"
                      min="1"
                      placeholder="일수 입력"
                      value={customIntakeDistance}
                      onChange={(e) => {
                        setCustomIntakeDistance(e.target.value);
                        // 직접 입력한 기간으로 종료일 계산
                        if (startDate && e.target.value) {
                          const endDate = new Date(startDate);
                          endDate.setDate(endDate.getDate() + parseInt(e.target.value));
                          setEndDate(endDate.toISOString().split('T')[0]);
                        }
                      }}
                      className="border rounded-md p-2 w-24"
                    />
                  )}
                </div>
              </div>

              {/* 복용 종료일 (자동 계산되거나 선택 가능) */}
              <div className="md:flex md:justify-between mb-4">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  복용 종료일
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border rounded-md p-2 w-full md:w-3/4"
                />
              </div>

              {/* 복용 시간대 선택 */}
              <div className="md:flex md:justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 md:w-1/4 mb-2 md:mb-0">
                  복용 시간대
                </label>
                <div className="w-full md:w-3/4 flex flex-wrap gap-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={intakeTimes.includes('아침')}
                      onChange={() => toggleIntakeTime('아침')}
                      className="form-checkbox h-5 w-5 text-teal-600"
                    />
                    <span className="ml-2">아침</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={intakeTimes.includes('점심')}
                      onChange={() => toggleIntakeTime('점심')}
                      className="form-checkbox h-5 w-5 text-teal-600"
                    />
                    <span className="ml-2">점심</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={intakeTimes.includes('저녁')}
                      onChange={() => toggleIntakeTime('저녁')}
                      className="form-checkbox h-5 w-5 text-teal-600"
                    />
                    <span className="ml-2">저녁</span>
                  </label>
                </div>
              </div>

              {/* 메모 입력 */}
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
                  일정 등록
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