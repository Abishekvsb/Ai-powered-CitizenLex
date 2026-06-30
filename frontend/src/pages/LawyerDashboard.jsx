import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

export default function LawyerDashboard() {
  const { user } = useAuth();

  const [lawyer, setLawyer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingName, setTypingName] = useState('');
  const [typingTimer, setTypingTimer] = useState(null);

  // Attachment upload loading
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState(''); // image or file

  // Active Video Meeting state
  const [activeMeetingRoom, setActiveMeetingRoom] = useState(null);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState([]);

  // Emoji picker toggle
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ['⚖️', '🏛️', '📜', '🔨', '🛡️', '✅', '⚠️', '👍', '🙏', '😊'];

  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const typingSubscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchLawyerDashboard = async () => {
    try {
      const lawyerRes = await axios.get('/api/lawyers/me');
      setLawyer(lawyerRes.data);

      const apptRes = await axios.get('/api/appointments/lawyer');
      setAppointments(apptRes.data || []);

      const roomsRes = await axios.get('/api/consultation/chat/rooms');
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLawyerDashboard();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const connectWebSocket = (roomId) => {
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    if (typingSubscriptionRef.current) typingSubscriptionRef.current.unsubscribe();

    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    client.debug = null;

    client.connect({}, () => {
      stompClientRef.current = client;

      subscriptionRef.current = client.subscribe(`/topic/room/${roomId}`, (payload) => {
        const msg = JSON.parse(payload.body);
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });

      typingSubscriptionRef.current = client.subscribe(`/topic/room/${roomId}/typing`, (payload) => {
        const data = JSON.parse(payload.body);
        if (data.sender !== user.firstName && data.status === 'TYPING') {
          setTypingName(data.sender);
        } else {
          setTypingName('');
        }
      });
    }, (err) => {
      console.error(err);
    });
  };

  const handleOpenRoom = async (roomId) => {
    setActiveRoomId(roomId);
    try {
      const msgRes = await axios.get(`/api/consultation/chat/rooms/${roomId}/messages`);
      setMessages(msgRes.data || []);
      connectWebSocket(roomId);
      await axios.put(`/api/consultation/chat/read/${roomId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAttachment(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'chat_attachment');

    try {
      const res = await axios.post('/api/lawyers/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachmentUrl(res.data.url);
      setAttachmentType(file.type.startsWith('image/') ? 'image' : 'file');
      alert("Attachment uploaded to Cloudinary successfully!");
    } catch (err) {
      alert("Upload failed. Only JPG, PNG, and PDF allowed.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachmentUrl) return;

    try {
      await axios.post('/api/consultation/chat/send', {
        roomId: activeRoomId,
        message: inputText,
        imageUrl: attachmentType === 'image' ? attachmentUrl : null,
        fileUrl: attachmentType === 'file' ? attachmentUrl : null
      });
      setInputText('');
      setAttachmentUrl('');
      setAttachmentType('');
      if (stompClientRef.current) {
        stompClientRef.current.send(`/app/chat/typing/${activeRoomId}`, {}, JSON.stringify({
          senderName: user.firstName,
          isTyping: false
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);

    if (stompClientRef.current && activeRoomId) {
      stompClientRef.current.send(`/app/chat/typing/${activeRoomId}`, {}, JSON.stringify({
        senderName: user.firstName,
        isTyping: true
      }));

      if (typingTimer) clearTimeout(typingTimer);

      const timer = setTimeout(() => {
        stompClientRef.current.send(`/app/chat/typing/${activeRoomId}`, {}, JSON.stringify({
          senderName: user.firstName,
          isTyping: false
        }));
      }, 2000);

      setTypingTimer(timer);
    }
  };

  const updateApptStatus = async (apptId, status) => {
    try {
      await axios.put(`/api/appointments/${apptId}/status`, null, { params: { status } });
      alert(`Appointment status updated to ${status}`);
      fetchLawyerDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const joinVideoMeeting = (appt) => {
    const roomName = appt.meetingUrl.split('/').pop();
    setActiveMeetingRoom(roomName);
  };

  const endVideoMeeting = () => {
    if (window.confirm("End the meeting call summary?")) {
      setActiveMeetingRoom(null);
      fetchLawyerDashboard();
    }
  };

  const handleToggleBlockDate = (dateStr) => {
    if (blockedDates.includes(dateStr)) {
      setBlockedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setBlockedDates(prev => [...prev, dateStr]);
    }
  };

  if (!lawyer) {
    return (
      <div className="container py-5 text-center text-white">
        <h5>Only registered and verified advocates can open this workspace.</h5>
      </div>
    );
  }

  const totalRevenue = appointments
    .filter(a => a.isPaid)
    .reduce((sum, a) => sum + a.consultationFee, 0);

  return (
    <div className="container py-5 text-start" style={{ position: 'relative' }}>
      <div className="glow-orb" style={{
        top: '15%',
        right: '15%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)',
      }} />

      {/* Jitsi meeting call overlay */}
      {activeMeetingRoom && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark d-flex flex-column" style={{ zIndex: 9999 }}>
          <div className="p-3 bg-glass border-bottom d-flex justify-content-between align-items-center" style={{ background: 'rgba(8,10,24,0.95)' }}>
            <div>
              <h5 className="text-white fw-bold mb-0">Advocate Secure Video Consultation Call</h5>
              <span className="small text-secondary">Active Jitsi Room</span>
            </div>
            <button onClick={endVideoMeeting} className="btn btn-danger btn-sm px-4" style={{ borderRadius: '8px' }}>
              <i className="bi bi-telephone-x me-1.5"></i> End consultation
            </button>
          </div>
          <div className="flex-grow-1 bg-black">
            <iframe
              src={`https://meet.jit.si/${activeMeetingRoom}`}
              title="Secure Video Consultation Call"
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-extrabold text-white mb-1">Advocate Command Console</h2>
          <p className="text-secondary small">Manage availability schedules, chat consultations, and video consultation bookings</p>
        </div>
        <span className="badge bg-success py-2 px-3 fw-bold rounded-pill" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
          <i className="bi bi-patch-check-fill me-1"></i> Verified Advocate Account
        </span>
      </div>

      {/* Statistics dashboard cards */}
      <div className="row g-3 mb-5">
        {[
          { label: 'Consultations Logged', value: appointments.length, icon: 'bi-calendar-check', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'Total Earnings', value: `₹${totalRevenue}`, icon: 'bi-wallet2', color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Feedback Rating', value: lawyer.rating, icon: 'bi-star-fill', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Chat Rooms', value: rooms.length, icon: 'bi-chat-left-dots', color: '#ec4899', bg: 'rgba(236,72,153,0.08)' }
        ].map((s, idx) => (
          <div className="col-sm-6 col-lg-3" key={idx}>
            <div className="glass-panel p-4 h-100 text-start" style={{
              borderRadius: '20px',
              border: '1.5px solid rgba(255,255,255,0.06)',
              background: 'rgba(8, 10, 24, 0.4)'
            }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="small text-secondary fw-semibold">{s.label}</span>
                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: s.bg, color: s.color, border: `1px solid ${s.color}20` }}>
                  <i className={`bi ${s.icon}`}></i>
                </div>
              </div>
              <h3 className="fw-extrabold text-white mb-0" style={{ letterSpacing: '-1px' }}>{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Grid View Row */}
      <div className="row mb-5">
        <div className="col-12">
          <CalendarWidget
            appointments={appointments}
            blockedDates={blockedDates}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            onToggleBlock={handleToggleBlockDate}
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Appointments Queue Control */}
        <div className="col-lg-5">
          <div className="glass-panel p-4 h-100" style={{ borderRadius: '22px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,10,24,0.4)' }}>
            <h5 className="fw-bold text-white mb-4"><i className="bi bi-list-task text-primary me-2"></i>Consultation Bookings Queue</h5>

            {appointments.length === 0 ? (
              <div className="text-center py-5 text-secondary small">
                No client appointments requested yet.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {appointments.map(appt => (
                  <div key={appt.id} className="p-3 rounded-4 text-start animate-hover" style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: appptBorder(appt.status)
                  }}>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <h6 className="fw-bold text-white mb-0.5">{appt.user?.firstName} {appt.user?.lastName}</h6>
                        <span className="small text-secondary">{appt.notes || 'No description notes provided.'}</span>
                      </div>
                      <span className={`badge px-2.5 py-1 ${badgeClass(appt.status)}`} style={{ borderRadius: '6px', fontSize: '0.7rem' }}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="text-white-50 small mb-3">
                      <div><i className="bi bi-calendar3 me-2 text-primary"></i>{appt.appointmentDate}</div>
                      <div><i className="bi bi-clock me-2 text-primary"></i>{appt.timeSlot}</div>
                      {appt.isPaid && (
                        <div className="text-success"><i className="bi bi-credit-card me-2"></i>Paid (Fee: ₹{appt.consultationFee})</div>
                      )}
                    </div>

                    {appt.status === 'PENDING' && (
                      <div className="d-flex gap-2">
                        <button onClick={() => updateApptStatus(appt.id, 'APPROVED')} className="btn btn-sm btn-success flex-grow-1" style={{ borderRadius: '8px' }}>Approve</button>
                        <button onClick={() => updateApptStatus(appt.id, 'REJECTED')} className="btn btn-sm btn-danger flex-grow-1" style={{ borderRadius: '8px' }}>Reject</button>
                      </div>
                    )}

                    {appt.status === 'APPROVED' && appt.meetingUrl && (
                      <button onClick={() => joinVideoMeeting(appt)} className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1.5 py-2" style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none' }}>
                        <i className="bi bi-camera-video-fill"></i>
                        <span>Launch Video Room</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Chats Portal widget */}
        <div className="col-lg-7">
          <div className="glass-panel p-4 d-flex flex-column justify-content-between" style={{ borderRadius: '22px', border: '1px solid rgba(255,255,255,0.08)', minHeight: '520px', background: 'rgba(8,10,24,0.4)' }}>
            
            {activeRoomId ? (
              <div className="d-flex flex-column h-100 justify-content-between text-start" style={{ flexGrow: 1 }}>
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-light-subtle">
                  <button onClick={() => setActiveRoomId(null)} className="btn btn-sm btn-link text-white-50 p-0 text-decoration-none"><i className="bi bi-chevron-left me-1"></i>Back</button>
                  <h6 className="fw-bold text-white mb-0">Client Chat dialogue</h6>
                  <span className="small text-secondary">STOMP socket active</span>
                </div>

                <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2 mb-3" style={{ maxHeight: '320px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
                  {messages.map((m, idx) => {
                    const isMe = m.sender?.id === user.id;
                    return (
                      <div key={idx} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div className="p-2.5 rounded-3 max-w-75 text-start" style={{
                          background: isMe ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
                          color: 'white',
                          border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          fontSize: '0.86rem'
                        }}>
                          {m.imageUrl && (
                            <img src={m.imageUrl} alt="Uploaded attachment" className="img-fluid rounded mb-2 d-block" style={{ maxHeight: '180px' }} />
                          )}
                          {m.fileUrl && (
                            <div className="mb-2 p-2 rounded bg-dark d-flex align-items-center gap-2">
                              <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                              <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-white text-decoration-none small text-truncate" style={{ maxWidth: '160px' }}>Attachment file</a>
                            </div>
                          )}
                          <div>{m.message}</div>
                          <div className="d-flex justify-content-end align-items-center gap-1.5 mt-1 text-white-50" style={{ fontSize: '0.62rem' }}>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <i className={`bi ${m.isRead ? 'bi-check-all text-primary' : 'bi-check'}`}></i>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingName && (
                    <div className="text-start text-secondary small italic px-2">
                      <span className="spinner-border spinner-border-sm me-1.5" role="status" style={{ width: '0.7rem', height: '0.7rem' }}></span>
                      {typingName} is writing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Emojis selector row */}
                {showEmojiPicker && (
                  <div className="mb-2 p-2 bg-dark rounded d-flex gap-2">
                    {emojis.map((e, idx) => (
                      <button key={idx} type="button" onClick={() => { setInputText(prev => prev + e); setShowEmojiPicker(false); }} className="btn btn-sm btn-link p-0 text-decoration-none fs-5">{e}</button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="btn btn-glass-secondary px-2.5" style={{ borderRadius: '10px' }}>
                    ⚖️
                  </button>
                  <label className="btn btn-glass-secondary px-2.5 mb-0" style={{ borderRadius: '10px', cursor: 'pointer' }}>
                    <i className="bi bi-paperclip text-secondary"></i>
                    <input type="file" className="d-none" onChange={handleAttachmentUpload} />
                  </label>
                  <input
                    type="text"
                    className="form-control form-glass-control"
                    placeholder="Type message..."
                    value={inputText}
                    onChange={handleTyping}
                  />
                  <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center" style={{ width: '42px', borderRadius: '10px' }} disabled={uploadingAttachment}>
                    {uploadingAttachment ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-send-fill"></i>}
                  </button>
                </form>
              </div>
            ) : (
              <div className="my-auto text-center text-secondary">
                <i className="bi bi-chat-dots fs-1 d-block mb-3 opacity-25"></i>
                <h6 className="text-white fw-bold">Active Consultations Chat Rooms</h6>
                <p className="small mb-4">Select a chat dialogue room to send text advice and share files.</p>
                
                {rooms.length > 0 ? (
                  <div className="d-flex flex-column gap-2 text-start">
                    {rooms.map(room => (
                      <button key={room.id} onClick={() => handleOpenRoom(room.id)} className="btn btn-glass-secondary w-100 p-3 text-start d-flex align-items-center gap-3" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10" style={{ width: '38px', height: '38px' }}>
                          <i className="bi bi-person text-primary"></i>
                        </div>
                        <div>
                          <h6 className="fw-bold text-white mb-0.5">{room.user?.firstName} {room.user?.lastName}</h6>
                          <span className="small text-secondary" style={{ fontSize: '0.7rem' }}>Client Contact: {room.user?.email}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="small">No active dialogue chambers</span>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// Monthly Calendar scheduler widget
function CalendarWidget({ appointments, blockedDates, currentDate, setCurrentDate, onToggleBlock }) {
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding for first week alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="glass-panel p-4" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-white mb-0">
          <i className="bi bi-calendar3 text-primary me-2"></i>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} Scheduler
        </h5>
        <div className="d-flex gap-2">
          <button onClick={prevMonth} className="btn btn-sm btn-glass text-white"><i className="bi bi-chevron-left"></i></button>
          <button onClick={nextMonth} className="btn btn-sm btn-glass text-white"><i className="bi bi-chevron-right"></i></button>
        </div>
      </div>

      <div className="grid text-center mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="small text-secondary fw-semibold">{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {days.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const dateStr = day.toISOString().split('T')[0];
          const isBlocked = blockedDates.includes(dateStr);
          const hasAppts = appointments.some(a => a.appointmentDate === dateStr);

          return (
            <div
              key={idx}
              onClick={() => onToggleBlock(dateStr)}
              className="p-3 rounded-3 text-white d-flex flex-column align-items-center justify-content-between position-relative animate-hover"
              style={{
                background: isBlocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)',
                border: isBlocked ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(255,255,255,0.05)',
                minHeight: '76px',
                cursor: 'pointer'
              }}
            >
              <span className={`small fw-bold ${isBlocked ? 'text-danger text-decoration-line-through' : ''}`}>{day.getDate()}</span>
              {hasAppts && (
                <span className="position-absolute" style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#6366f1', bottom: '10px'
                }}></span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 small text-secondary">
        <span className="me-3"><i className="bi bi-circle-fill text-primary me-1.5" style={{ fontSize: '0.6rem' }}></i>Has Consultations</span>
        <span><i className="bi bi-square-fill text-danger me-1.5" style={{ fontSize: '0.6rem' }}></i>Blocked Dates / Holidays (Click to toggle)</span>
      </div>
    </div>
  );
}

// Helpers
const badgeClass = (status) => {
  if (status === 'APPROVED') return 'bg-success bg-opacity-10 text-success';
  if (status === 'REJECTED') return 'bg-danger bg-opacity-10 text-danger';
  if (status === 'COMPLETED') return 'bg-info bg-opacity-10 text-info';
  return 'bg-warning bg-opacity-10 text-warning';
};

const appptBorder = (status) => {
  if (status === 'APPROVED') return '1px solid rgba(16,185,129,0.2)';
  if (status === 'REJECTED') return '1px solid rgba(239,68,68,0.2)';
  return '1px solid rgba(255,255,255,0.06)';
};
