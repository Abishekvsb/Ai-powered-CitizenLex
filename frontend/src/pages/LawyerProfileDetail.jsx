import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LawyerProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lawyer, setLawyer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scheduling slot picker
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  const timeSlots = [
    '09:00 AM - 09:30 AM',
    '10:00 AM - 10:30 AM',
    '11:00 AM - 11:30 AM',
    '02:00 PM - 02:30 PM',
    '03:00 PM - 03:30 PM',
    '04:00 PM - 04:30 PM'
  ];

  const fetchProfile = async () => {
    try {
      const [lawyerRes, reviewsRes] = await Promise.all([
        axios.get(`/api/lawyers/${id}`),
        axios.get(`/api/lawyers/${id}/reviews`) // We can write reviews retrieval under lawyer REST endpoint or handle directly
      ]);
      setLawyer(lawyerRes.data);
      // Optional fallback
      setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      alert("Please select a date and slot.");
      return;
    }
    setBookingLoading(true);

    try {
      // 1. Initiate booking
      const bookRes = await axios.post('/api/appointments/book', {
        lawyerId: id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        notes: notes
      });

      const apptId = bookRes.data.id;

      // 2. Initiate mock Razorpay Payment order details
      const payInit = await axios.post(`/api/appointments/${apptId}/payment/initiate`);
      const orderId = payInit.data.orderId;

      // 3. Complete mock payment
      alert(`Razorpay Payment Gateway Simulation:\nOrder ID: ${orderId}\nConsultation Fee: ₹${lawyer.consultationFee}\n\nClick OK to simulate successful payment.`);
      
      const payComplete = await axios.post(`/api/appointments/${apptId}/payment/complete`, {
        paymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 10)
      });

      alert("Appointment and Payment successful! Redirecting to consultations panel.");
      navigate('/consultations');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Booking failed. Slot may already be reserved.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    if (!comment.trim()) return;

    try {
      await axios.post(`/api/lawyers/${id}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      alert("Review submitted successfully!");
      fetchProfile();
    } catch (err) {
      setReviewError(err.response?.data?.error || "Review submission blocked. You must complete a consultation with this advocate first.");
    }
  };

  const initiateChat = async () => {
    try {
      const res = await axios.post('/api/consultation/chat/rooms/initiate', { lawyerId: id });
      navigate('/consultations', { state: { openRoomId: res.data.id } });
    } catch (err) {
      console.error(err);
      alert("Failed to start chat.");
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="skeleton-loader" style={{ height: '400px', borderRadius: '24px' }}></div>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="container py-5 text-center text-white">
        <h5>Advocate profile not found.</h5>
      </div>
    );
  }

  return (
    <div className="container py-5 text-start" style={{ position: 'relative' }}>
      {/* Background glow mesh */}
      <div className="glow-orb" style={{
        top: '10%',
        left: '20%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
      }} />

      {/* Main Grid */}
      <div className="row g-4 fade-in-el">
        {/* Profile Card Summary & Booking Widget */}
        <div className="col-lg-8">
          <div className="glass-panel p-4 mb-4" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,10,24,0.4)' }}>
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
              {lawyer.user?.profileImageUrl ? (
                <img src={lawyer.user.profileImageUrl} alt="Lawyer" style={{ width: '92px', height: '92px', borderRadius: '20px', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.4)' }} />
              ) : (
                <div style={{
                  width: '92px', height: '92px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, color: 'white'
                }}>
                  {lawyer.user?.firstName?.[0] || 'L'}
                </div>
              )}
              <div className="text-start">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h3 className="fw-extrabold text-white mb-0">{lawyer.user?.firstName} {lawyer.user?.lastName}</h3>
                  {lawyer.isVerified && (
                    <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <i className="bi bi-patch-check-fill"></i> Verified
                    </span>
                  )}
                </div>
                <p className="text-secondary mb-2.5 fw-semibold">{lawyer.specialization?.name} | Advocate Reg: {lawyer.advocateId}</p>
                <div className="d-flex flex-wrap gap-2.5 text-white-50 small">
                  <span><i className="bi bi-star-fill text-warning me-1"></i>{lawyer.rating} ({lawyer.totalReviews} reviews)</span>
                  <span>|</span>
                  <span><i className="bi bi-translate me-1 text-primary"></i>{lawyer.languages || 'English'}</span>
                  <span>|</span>
                  <span><i className="bi bi-briefcase me-1 text-primary"></i>{lawyer.experienceYears} Years Experience</span>
                </div>
              </div>
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Biography */}
            <div className="mb-4">
              <h5 className="fw-bold text-white mb-2">Biography</h5>
              <p className="text-secondary small" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{lawyer.bio || 'No biography details provided.'}</p>
            </div>

            {/* Qualifications & Achievements */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <div className="p-3 rounded-4 h-100" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h6 className="fw-bold text-white mb-2"><i className="bi bi-mortarboard text-primary me-2"></i>Qualifications</h6>
                  <p className="text-secondary small mb-0">{lawyer.qualifications || 'LL.B, State Enrollment'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded-4 h-100" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h6 className="fw-bold text-white mb-2"><i className="bi bi-award text-warning me-2"></i>Achievements</h6>
                  <p className="text-secondary small mb-0">{lawyer.achievements || 'Certified Advocate member'}</p>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button onClick={initiateChat} className="btn btn-glass-secondary d-flex align-items-center gap-2" style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>
                <i className="bi bi-chat-right-text-fill text-primary"></i>
                <span>Chat consultations</span>
              </button>
            </div>
          </div>

          {/* Client Reviews Section */}
          <div className="glass-panel p-4" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h5 className="fw-bold text-white mb-4"><i className="bi bi-star-fill text-warning me-2"></i>Ratings & Reviews</h5>

            {/* Write a review form */}
            {user && (
              <form onSubmit={handleReviewSubmit} className="mb-5 p-3 rounded-4 text-start" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h6 className="fw-bold text-white mb-2">Leave your consultation feedback</h6>
                
                {reviewError && (
                  <div className="alert alert-danger py-2 px-3 small border-0 mb-3" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                    {reviewError}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold mb-1">Rating</label>
                  <select className="form-select form-glass-control" value={rating} onChange={e => setRating(e.target.value)} style={{ width: '120px', background: '#07061d', color: 'white' }}>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold mb-1">Comments</label>
                  <textarea className="form-control form-glass-control" rows="3" placeholder="Write feedback..." value={comment} onChange={e => setComment(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-sm text-dark fw-bold" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: '8px', padding: '8px 20px' }}>Submit Review</button>
              </form>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-4 text-secondary small">
                No reviews written yet. Completed consultations can leave reviews.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-3 rounded-4 text-start" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="fw-bold text-white mb-0">{rev.user?.firstName} {rev.user?.lastName}</h6>
                      <span className="small text-warning"><i className="bi bi-star-fill me-1"></i>{rev.rating} Stars</span>
                    </div>
                    <p className="text-secondary small mb-2">{rev.comment}</p>
                    <div className="d-flex gap-3 text-secondary" style={{ fontSize: '0.72rem' }}>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      <button onClick={async () => {
                        try {
                          await axios.post(`/api/lawyers/reviews/${rev.id}/vote`, { isUpvote: true });
                          fetchProfile();
                        } catch {}
                      }} className="btn btn-link p-0 text-decoration-none small text-secondary"><i className="bi bi-hand-thumbs-up me-1"></i>Helpful ({rev.helpfulVotes || 0})</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Appointment Scheduler Widget Card */}
        <div className="col-lg-4">
          <div className="glass-panel p-4 sticky-top" style={{ top: '90px', borderRadius: '24px', border: '1.5px solid rgba(99,102,241,0.25)', background: 'rgba(8,10,24,0.48)' }}>
            <h5 className="fw-bold text-white mb-3"><i className="bi bi-calendar-event text-primary me-2"></i>Book Consultation</h5>
            <div className="text-start mb-4">
              <span className="small text-secondary">Fee (Standard 30 min)</span>
              <h3 className="fw-extrabold text-white mb-0" style={{ letterSpacing: '-0.8px' }}>₹{lawyer.consultationFee}</h3>
            </div>

            <form onSubmit={handleBooking} className="text-start">
              {/* Date */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary mb-1">Select Consultation Date</label>
                <input
                  type="date"
                  className="form-control form-glass-control"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Time slot */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary mb-1">Select Time Slot</label>
                <select className="form-select form-glass-control" value={selectedSlot} onChange={e => setSelectedSlot(e.target.value)} required style={{ background: '#07061d', color: 'white' }}>
                  <option value="">Choose slot</option>
                  {timeSlots.map((slot, idx) => (
                    <option key={idx} value={slot} style={{ background: '#07061d' }}>{slot}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary mb-1">Brief Description of Issue</label>
                <textarea className="form-control form-glass-control" rows="3" placeholder="Explain details..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <button type="submit" className="btn w-100 py-3 text-white fw-bold d-flex align-items-center justify-content-center gap-1.5" disabled={bookingLoading} style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.92rem'
              }}>
                <span>{bookingLoading ? 'Processing...' : 'Proceed to Pay & Book'}</span>
                <i className="bi bi-wallet2"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
