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
import { 
  searchProducts, 
  createSchedule, 
  getAllSchedules, 
  getDailySchedules, 
  getWeeklySchedules, 
  updateSchedule, 
  deleteSchedule 
} from '../services/api';

// Localizer 설정
const localizer = momentLocalizer(moment);

// Drag and Drop 캘린더
const DnDCalendar = withDragAndDrop(Calendar);

// Styled Components로 캘린더 스타일링
const StyledCalendar = styled(Calendar)`
  .rbc-event {
    background-color: #209696; 
    color: white;
    border-radius: 4px;
    transition: background-color 0.3s ease;
    &:hover {
      background-color: #1a8c8c;
    }
  }
  .rbc-day-bg {
    background-color: #f0f8ff;
  }
  .rbc-today {
    background-color: #e0f7fa;
  }
  .rbc-time-slot {
    border-left: 2px solid #209696;
  }
`;

const Schedule = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [todayPlan, setTodayPlan] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState({});
  
  // 새로운 일정 등록을 위한 상태 변수들
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [intakeDistance, setIntakeDistance] = useState('');
  const [customIntakeDistance, setCustomIntakeDistance] = useState('');
  const [intakeTimes, setIntakeTimes] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [memo, setMemo] = useState('');

  // 복용 시간대 토글 함수
  const toggleIntakeTime = (time) => {
    setIntakeTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time) 
        : [...prev, time]
    );
  };

  // 제품 검색 함수
  const handleProductSearch = async (searchTerm) => {
    setProductSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setProductResults([]);
      return;
    }
    
    try {
      const response = await searchProducts(searchTerm);
      if (response.data?.data) {
        setProductResults(response.data.data);
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

  // 일정 등록 핸들러
  const handleAddEvent = async () => {
    if (!selectedProduct) {
      alert('영양제를 선택해주세요.');
      return;
    }
    
    if (intakeTimes.length === 0) {
      alert('복용 시간대를 선택해주세요.');
      return;
    }
    
    const finalEndDate = endDate || (() => {
      const calcEndDate = new Date(startDate);
      calcEndDate.setDate(calcEndDate.getDate() + 30);
      return calcEndDate.toISOString().split('T')[0];
    })();
    
    const distance = intakeDistance === 'custom' 
      ? parseInt(customIntakeDistance) 
      : intakeDistance 
        ? parseInt(intakeDistance) 
        : 30;
    
    try {
      const scheduleData = {
        prdId: selectedProduct.prdId,
        productName: selectedProduct.productName,
        intakeStart: startDate,
        intakeDistance: distance,
        intakeEnd: finalEndDate,
        intakeTimes: intakeTimes,
        memo: memo
      };
      
      const response = await createSchedule(scheduleData);
      
      // 캘린더에 이벤트 추가 로직
      const newEvents = intakeTimes.map((time, index) => {
        let hours = time === '아침' ? 8 : time === '점심' ? 12 : 19;
        
        const start = new Date(startDate);
        start.setHours(hours, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 30);
        
        return {
          id: response.data[index] || (Date.now() + index),
          title: `${selectedProduct.productName} - ${time}`,
          start,
          end,
          allDay: false
        };
      });
      
      setEvents(prev => [...prev, ...newEvents]);
      
      alert('복용 일정이 등록되었습니다.');
      
      // 폼 초기화
      resetForm();
      
      // 일정 다시 로드
      fetchAllSchedules();
    } catch (error) {
      console.error('일정 등록 중 오류:', error);
      alert('일정 등록 중 오류가 발생했습니다.');
    }
  };

  // 폼 초기화 함수
  const resetForm = () => {
    setProductSearch('');
    setSelectedProduct(null);
    setIntakeTimes([]);
    setMemo('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIntakeDistance('');
    setCustomIntakeDistance('');
  };

  // 이벤트 드래그 앤 드롭 처리
  const moveEvent = async ({ event, start, end }) => {
    try {
      await updateSchedule(event.id, { 
        intakeStart: start, 
        intakeEnd: end 
      });
      
      const updatedEvents = events.map((existingEvent) =>
        existingEvent.id === event.id 
          ? { ...existingEvent, start, end } 
          : existingEvent
      );
      
      setEvents(updatedEvents);
    } catch (error) {
      console.error('이벤트 업데이트 중 오류:', error);
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (event) => {
    try {
      await deleteSchedule(event.id);
      
      const updatedEvents = events.filter((e) => e.id !== event.id);
      setEvents(updatedEvents);
      
      alert('일정이 삭제되었습니다.');
    } catch (error) {
      console.error('이벤트 삭제 중 오류:', error);
      alert('이벤트 삭제 중 오류가 발생했습니다.');
    }
  };

  // 전체 일정 로드
  const fetchAllSchedules = async () => {
    try {
      const response = await getAllSchedules();
      
      const formattedEvents = response.data.map((schedule) => ({
        id: schedule.scheduleId,
        title: `${schedule.productName || '영양제'} - ${schedule.intakeTime}`, 
        start: new Date(schedule.intakeStart),
        end: schedule.intakeEnd ? new Date(schedule.intakeEnd) : new Date(schedule.intakeStart),
        allDay: false
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('전체 일정 로드 중 오류:', error);
    }
  };

  // 오늘의 일정 로드
  const fetchTodaySchedules = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await getDailySchedules(today);
      
      setTodayPlan(response.data.map(schedule => ({
        supplement: schedule.productName,
        time: schedule.intakeTime,
        id: schedule.scheduleId
      })));
    } catch (error) {
      console.error('오늘의 일정 로드 중 오류:', error);
    }
  };

  // 주간 일정 로드
  const fetchWeeklySchedules = async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
      const response = await getWeeklySchedules(startOfWeek.toISOString().split('T')[0]);
      
      setWeeklyPlan(response.data);
    } catch (error) {
      console.error('주간 일정 로드 중 오류:', error);
    }
  };

  // 알림 기능
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

  // 초기 데이터 로드
  useEffect(() => {
    fetchAllSchedules();
    fetchTodaySchedules();
    fetchWeeklySchedules();
  }, []);

  return (
    <div className="bg-gray-50 font-['Noto_Sans_KR']">
      <Header />
      
      <main className="p-6 mt-4 container mx-auto">
        <div className="max-w-7xl mx-auto">
          {/* 오늘의 영양제 */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">오늘의 영양제</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {['아침', '점심', '저녁'].map((time) => (
              <div key={time} className="bg-white shadow rounded-lg p-5 flex items-center">
                <i className={`
                  ${time === '아침' ? 'fas fa-sun text-yellow-400' : 
                    time === '점심' ? 'fas fa-cloud-sun text-orange-400' : 
                    'fas fa-moon text-blue-500'} 
                  text-2xl
                `}></i>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-gray-900">{time}</h4>
                  {todayPlan
                    .filter(item => item.time === time)
                    .map((item, index) => (
                      <p key={index} className="text-sm text-gray-900">{item.supplement}</p>
                    ))}
                </div>
              </div>
            ))}
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
                selectable={true}
                droppable={true}
                components={{
                  event: (props) => (
                    <div
                      {...props}
                      className="bg-teal-500 text-white p-2 rounded cursor-pointer hover:bg-teal-600 flex items-center justify-between"
                    >
                      <span>{props.event.title}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(props.event);
                        }} 
                        className="text-red-500 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ),
                }}
              />
            </div>
          </div>

          {/* 복용 일정 등록 */}
          <div className="mt-4 p-4 bg-white shadow rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">복용 일정 등록</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddEvent();
            }}>
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
                    onChange={(e) => handleProductSearch(e.target.value)}
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
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // 종료일 자동 계산 로직 추가
                    if (intakeDistance && intakeDistance !== 'custom') {
                      const end = new Date(e.target.value);
                      end.setDate(end.getDate() + parseInt(intakeDistance));
                      setEndDate(end.toISOString().split('T')[0]);
                    }
                  }}
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
                        const end = new Date(startDate);
                        end.setDate(end.getDate() + parseInt(e.target.value));
                        setEndDate(end.toISOString().split('T')[0]);
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
                          const end = new Date(startDate);
                          end.setDate(end.getDate() + parseInt(e.target.value));
                          setEndDate(end.toISOString().split('T')[0]);
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
                  {['아침', '점심', '저녁'].map((time) => (
                    <label key={time} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={intakeTimes.includes(time)}
                        onChange={() => toggleIntakeTime(time)}
                        className="form-checkbox h-5 w-5 text-teal-600"
                      />
                      <span className="ml-2">{time}</span>
                    </label>
                  ))}
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
                  placeholder="복용 시 참고할 메모를 입력하세요"
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