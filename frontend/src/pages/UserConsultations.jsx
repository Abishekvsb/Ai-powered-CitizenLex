import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

export default function UserConsultations() {
  const { user } = useAuth();
  const location = useLocation();

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
  const [activeMeetingApptId, setActiveMeetingApptId] = useState(null);

  // Emoji picker toggle
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ['⚖️', '🏛️', '📜', '🔨', '🛡️', '✅', '⚠️', '👍', '🙏', '😊'];

  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const typingSubscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchConsultations = async () => {
    try {
      const apptRes = await axios.get('/api/appointments/user');
      setAppointments(apptRes.data || []);

      const roomsRes = await axios.get('/api/consultation/chat/rooms');
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConsultations();
    if (location.state && location.state.openRoomId) {
      handleOpenRoom(location.state.openRoomId);
    }
  }, [location.state]);

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
      alert("Media attachment uploaded to Cloudinary successfully!");
    } catch (err) {
      alert("Attachment upload failed. Only JPG, PNG, and PDF allowed.");
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

  const joinVideoMeeting = (appt) => {
    const roomName = appt.meetingUrl.split('/').pop();
    setActiveMeetingRoom(roomName);
    setActiveMeetingApptId(appt.id);
  };

  const endVideoMeeting = async () => {
    if (window.confirm("Are you sure you want to exit the video meeting?")) {
      setActiveMeetingRoom(null);
      setActiveMeetingApptId(null);
      fetchConsultations();
    }
  };

  return (
    <div className="container py-5 text-start" style={{ position: 'relative' }}>
      <div className="glow-orb" style={{
        top: '10%',
        left: '20%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
      }} />

      {/* Video Consultation Iframe overlay */}
      {activeMeetingRoom && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark d-flex flex-column" style={{ zIndex: 9999 }}>
          <div className="p-3 bg-glass border-bottom d-flex justify-content-between align-items-center" style={{ background: 'rgba(8,10,24,0.95)' }}>
            <div>
              <h5 className="text-white fw-bold mb-0">Secure Legal Consultation Call</h5>
              <span className="small text-secondary">Jitsi Meet WebRTC Active</span>
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

      <h2 className="fw-extrabold text-white mb-4"><i className="bi bi-person-video3 text-primary me-2.5"></i>My Legal Consultations</h2>

      <div className="row g-4">
        {/* Appointments history list */}
        <div className="col-lg-5">
          <div className="glass-panel p-4 h-100" style={{ borderRadius: '22px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,10,24,0.4)' }}>
            <h5 className="fw-bold text-white mb-4"><i className="bi bi-clock-history text-primary me-2"></i>Consultation Bookings</h5>

            {appointments.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <i className="bi bi-calendar-x fs-1 d-block mb-3 opacity-25"></i>
                <p className="mb-2 fw-semibold text-white">No bookings logged</p>
                <p className="small mb-3">You can discover and book advice sessions with verified advocates.</p>
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
                        <h6 className="fw-bold text-white mb-0.5">Advocate {appt.lawyer?.user?.firstName} {appt.lawyer?.user?.lastName}</h6>
                        <span className="small text-secondary">{appt.lawyer?.specialization?.name}</span>
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

                    {appt.status === 'APPROVED' && appt.meetingUrl && (
                      <button onClick={() => joinVideoMeeting(appt)} className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1.5 py-2" style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none' }}>
                        <i className="bi bi-camera-video-fill"></i>
                        <span>Start Video Call</span>
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
                {/* Chat window header */}
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-light-subtle">
                  <button onClick={() => setActiveRoomId(null)} className="btn btn-sm btn-link text-white-50 p-0 text-decoration-none"><i className="bi bi-chevron-left me-1"></i>Back</button>
                  <h6 className="fw-bold text-white mb-0">Consultation Dialogue</h6>
                  <span className="small text-secondary">STOMP socket active</span>
                </div>

                {/* Messages stream */}
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

                {/* Emojis selection row */}
                {showEmojiPicker && (
                  <div className="mb-2 p-2 bg-dark rounded d-flex gap-2">
                    {emojis.map((e, idx) => (
                      <button key={idx} type="button" onClick={() => { setInputText(prev => prev + e); setShowEmojiPicker(false); }} className="btn btn-sm btn-link p-0 text-decoration-none fs-5">{e}</button>
                    ))}
                  </div>
                )}

                {/* Input box */}
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
                <h6 className="text-white fw-bold">Advocate Dialogues Portal</h6>
                <p className="small mb-4">Select a registered chat room to begin real-time consultation messaging.</p>
                
                {rooms.length > 0 ? (
                  <div className="d-flex flex-column gap-2 text-start">
                    {rooms.map(room => (
                      <button key={room.id} onClick={() => handleOpenRoom(room.id)} className="btn btn-glass-secondary w-100 p-3 text-start d-flex align-items-center gap-3" style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10" style={{ width: '38px', height: '38px' }}>
                          <i className="bi bi-chat-left-text-fill text-primary"></i>
                        </div>
                        <div>
                          <h6 className="fw-bold text-white mb-0.5">Advocate {room.lawyer?.user?.firstName} {room.lawyer?.user?.lastName}</h6>
                          <span className="small text-secondary" style={{ fontSize: '0.7rem' }}>Practice: {room.lawyer?.specialization?.name}</span>
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
