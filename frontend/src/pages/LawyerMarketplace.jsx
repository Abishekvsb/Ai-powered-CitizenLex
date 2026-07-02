import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LawyerMarketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [lawyers, setLawyers] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState(!!window.google);

  // --- Search & Filters State ---
  const [search, setSearch] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [cityId, setCityId] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [language, setLanguage] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [minRating, setMinRating] = useState('');
  const [onlineConsultation, setOnlineConsultation] = useState(false);
  const [availableToday, setAvailableToday] = useState(false);
  const [sortBy, setSortBy] = useState('id_desc');

  // AI Recommendation matching
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [diagnosticStep, setDiagnosticStep] = useState(0);
  const [aiRecommendedIds, setAiRecommendedIds] = useState(new Set());
  const [aiMatchReasons, setAiMatchReasons] = useState({});
  const [diagnosticSummary, setDiagnosticSummary] = useState(null);

  // Layout states
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [selectedLawyerId, setSelectedLawyerId] = useState(null);
  const [hoveredLawyerId, setHoveredLawyerId] = useState(null);

  // --- Booking Modal State ---
  const [bookingLawyer, setBookingLawyer] = useState(null);
  const [bookingStep, setBookingStep] = useState(1); // 1: Review, 2: Date, 3: Slot, 4: Contact, 5: Payment, 6: Success
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [caseDesc, setCaseDesc] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);

  // --- Google Maps State ---
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyType, setNearbyType] = useState('court'); // court, police, legal_aid
  const [directionsInfo, setDirectionsInfo] = useState(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    return JSON.parse(localStorage.getItem('recentSearches') || '[]');
  });

  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const markersRef = useRef([]);
  const lawyerMarkersRef = useRef({});
  const autocompleteInputRef = useRef(null);

  const timeSlots = [
    '09:00 AM - 09:30 AM',
    '10:00 AM - 10:30 AM',
    '11:00 AM - 11:30 AM',
    '02:00 PM - 02:30 PM',
    '03:00 PM - 03:30 PM',
    '04:00 PM - 04:30 PM'
  ];

  const districtsList = [
    "Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli",
    "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul",
    "Thanjavur", "Tiruppur", "Kanchipuram", "Tiruvallur", "Cuddalore",
    "Kanyakumari", "Karur", "Namakkal", "Theni", "Virudhunagar"
  ];

  const casePresets = [
    { label: "Landlord refusing to refund security advance", query: "My landlord in Chennai is refusing to return my security deposit advance of Rs 50,000 despite vacating." },
    { label: "Drafting NDA & Master Services Agreement", query: "Need a corporate lawyer to draft a non-disclosure agreement and a software master services contract." },
    { label: "Mutual consent divorce & property partition", query: "Filing for mutual separation divorce and partitioning family ancestral property." },
    { label: "Wrongful termination & unpaid salary claim", query: "Employer terminated me without notice period and is holding back my 3 months salary." }
  ];

  const diagnosticStepsList = [
    "🤖 Parsing case facts & extracting legal parameters...",
    "🔍 Checking primary legal domain & specialization requirements...",
    "⚖️ Filtering Bar Council database for registered advocates...",
    "⚡ Optimizing match scores & regional proximity..."
  ];

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (specializationId) params.specializationId = specializationId;
      if (cityId) params.cityId = cityId;
      if (language) params.language = language;
      if (minExperience) params.minExperience = minExperience;
      if (maxFee) params.maxFee = maxFee;
      if (minRating) params.minRating = minRating;
      if (search) params.search = search;
      if (sortBy) params.sortBy = sortBy;
      if (selectedState) params.state = selectedState;
      if (selectedDistrict) params.district = selectedDistrict;
      if (onlineConsultation) params.isOnline = true;

      const res = await axios.get('/api/lawyers', { params });
      let data = res.data || [];

      if (availableToday) {
        data = data.filter(l => l.workingHours && l.workingHours.length > 0);
      }

      setLawyers(data);
      plotLawyerMarkers(data);
    } catch (err) {
      console.error('Failed to load lawyers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [specRes, cityRes] = await Promise.all([
          axios.get('/api/lawyers/specializations'),
          axios.get('/api/lawyers/cities')
        ]);
        setSpecializations(specRes.data || []);
        setCities(cityRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchLawyers();
  }, [specializationId, cityId, language, minExperience, maxFee, minRating, sortBy, selectedState, selectedDistrict, onlineConsultation, availableToday]);

  useEffect(() => {
    if (bookingLawyer && user) {
      setClientName(`${user.firstName || ''} ${user.lastName || ''}`);
      setClientEmail(user.email || '');
      setClientPhone(user.mobile || '');
    }
  }, [bookingLawyer, user]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      if (!window.google) {
        const script = document.createElement('script');
        script.src = apiKey
          ? `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
          : `https://maps.googleapis.com/maps/api/js?libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setIsScriptLoaded(true);
        };
        script.onerror = () => {
          console.error("Failed to load Google Maps script.");
        };
        document.head.appendChild(script);
      } else {
        setIsScriptLoaded(true);
      }
    };
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (isScriptLoaded && mapRef.current && !map) {
      initializeMap();
    }
  }, [isScriptLoaded, map, mapRef]);

  const getLawyerLatLng = (lawyer) => {
    if (lawyer.latitude && lawyer.longitude) {
      return {
        lat: parseFloat(lawyer.latitude),
        lng: parseFloat(lawyer.longitude)
      };
    }
    return { lat: 13.0827, lng: 80.2707 };
  };

  const getNextAvailableSlot = (lawyerId) => {
    const days = ["Today", "Tomorrow", "In 2 days"];
    const times = ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM", "05:30 PM"];
    const dayIndex = (lawyerId * 3) % days.length;
    const timeIndex = (lawyerId * 7) % times.length;
    return `${days[dayIndex]} – ${times[timeIndex]}`;
  };

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const defaultLatLng = { lat: 13.0827, lng: 80.2707 };

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultLatLng,
      zoom: 11,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0b0c16" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0b0c16" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9aa5b1" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#030712" }] }
      ]
    });

    const renderer = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: false
    });
    directionsRendererRef.current = renderer;

    setMap(mapInstance);

    if (autocompleteInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: 'in' }
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const selectedLatLng = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          setUserLocation(selectedLatLng);
          mapInstance.setCenter(selectedLatLng);
          mapInstance.setZoom(13);
        }
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userLatLng);
          mapInstance.setCenter(userLatLng);

          new window.google.maps.Marker({
            position: userLatLng,
            map: mapInstance,
            title: "Your Location",
            icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          });

          searchNearbyLegalPlaces(mapInstance, userLatLng, nearbyType);
        },
        (error) => {
          console.warn("Geolocation warning:", error.message);
          setUserLocation(defaultLatLng);
          searchNearbyLegalPlaces(mapInstance, defaultLatLng, nearbyType);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    } else {
      setUserLocation(defaultLatLng);
      searchNearbyLegalPlaces(mapInstance, defaultLatLng, nearbyType);
    }
  };

  const searchNearbyLegalPlaces = (mapInstance, location, type) => {
    if (!window.google || !mapInstance) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const service = new window.google.maps.places.PlacesService(mapInstance);
    const queryMap = {
      court: 'court',
      police: 'police station',
      legal_aid: 'legal aid center'
    };

    const request = {
      location: location,
      radius: '8000',
      query: queryMap[type] || 'court'
    };

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach((place) => {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: mapInstance,
            title: place.name,
            icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          });
          markersRef.current.push(marker);
        });
      }
    });
  };

  useEffect(() => {
    if (map && userLocation) {
      searchNearbyLegalPlaces(map, userLocation, nearbyType);
    }
  }, [nearbyType, map, userLocation]);

  const plotLawyerMarkers = (lawyerList) => {
    if (!window.google || !map) return;

    Object.values(lawyerMarkersRef.current).forEach(m => m.setMap(null));
    lawyerMarkersRef.current = {};

    if (lawyerList.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;

    if (userLocation) {
      bounds.extend(userLocation);
      hasValidBounds = true;
    }

    lawyerList.forEach((lawyer) => {
      const latLng = getLawyerLatLng(lawyer);
      bounds.extend(latLng);
      hasValidBounds = true;

      const marker = new window.google.maps.Marker({
        position: latLng,
        map: map,
        title: `Advocate ${lawyer.user?.firstName || ''} ${lawyer.user?.lastName || ''}`,
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
      });

      const contentString = `
        <div style="color: #030712; padding: 12px; font-family: sans-serif; text-align: left; min-width: 230px;">
          <div style="margin-bottom: 6px; overflow: hidden;">
            <img src="${lawyer.user?.profileImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50'}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover; float: left; margin-right: 8px; border: 1.5px solid #d4af37;" />
            <div style="float: left; width: 150px;">
              <h6 style="margin: 0; font-weight: bold; color: #1f2937; font-size: 13px;">Advocate ${lawyer.user?.firstName || ''} ${lawyer.user?.lastName || ''}</h6>
              <p style="margin: 2px 0; font-size: 11px; color: #4b5563;">${lawyer.specialization?.name || 'Practice Area'}</p>
            </div>
          </div>
          <div style="font-size: 11px; margin-bottom: 8px; clear: both; color: #374151;">
            <strong>Office:</strong> ${lawyer.officeAddress || 'Court Chambers'}<br/>
            <strong>Rating:</strong> ⭐ ${lawyer.rating || 5.0} | <strong>Fee:</strong> ₹${lawyer.consultationFee}
          </div>
        </div>
      `;

      const infowindow = new window.google.maps.InfoWindow({
        content: contentString,
      });

      marker.addListener("click", () => {
        setSelectedLawyerId(lawyer.id);
        infowindow.open({ anchor: marker, map });
        calculateDirections(lawyer);
      });

      lawyerMarkersRef.current[lawyer.id] = marker;
    });

    if (hasValidBounds) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom() > 14) map.setZoom(14);
        window.google.maps.event.removeListener(listener);
      });
    }
  };

  const focusLawyer = (lawyer) => {
    setSelectedLawyerId(lawyer.id);
    const latLng = getLawyerLatLng(lawyer);
    if (map) {
      map.setCenter(latLng);
      map.setZoom(14);
      
      const marker = lawyerMarkersRef.current[lawyer.id];
      if (marker) {
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1200);
      }
    }
    calculateDirections(lawyer);
  };

  const calculateDirections = (lawyer) => {
    if (!window.google || !map || !userLocation) return;

    const destination = getLawyerLatLng(lawyer);
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: userLocation,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          const route = result.routes[0].legs[0];
          setDirectionsInfo({
            distance: route.distance.text,
            duration: route.duration.text,
            lawyerName: `${lawyer.user?.firstName || ''} ${lawyer.user?.lastName || ''}`
          });
        }
      }
    );
  };

  const triggerPresetSearch = (queryText) => {
    setAiQuery(queryText);
    triggerAiMatchForText(queryText);
  };

  const triggerAiMatchForText = async (textVal) => {
    setAiLoading(true);
    setDiagnosticStep(0);
    setDiagnosticSummary(null);

    const stepInterval = setInterval(() => {
      setDiagnosticStep(prev => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          return 3;
        }
        return prev + 1;
      });
    }, 450);

    try {
      const res = await axios.get('/api/lawyers/recommend', { params: { query: textVal } });
      const matching = res.data || [];
      
      setTimeout(() => {
        setLawyers(matching);
        plotLawyerMarkers(matching);

        const matchedIds = new Set();
        const reasons = {};
        matching.forEach((l, idx) => {
          matchedIds.add(l.id);
          const score = 98 - (idx * 3);
          reasons[l.id] = {
            score: `${score}%`,
            reason: `Highly matched because Advocate ${l.user?.firstName} practices in ${l.specialization?.name} with ${l.experienceYears} years of experience and is located in the ${l.city?.name || 'regional'} jurisdiction.`
          };
        });
        setAiRecommendedIds(matchedIds);
        setAiMatchReasons(reasons);

        // Generate dynamic diagnostic summary
        const detectedSpec = matching[0]?.specialization?.name || "Civil Litigation";
        setDiagnosticSummary({
          category: detectedSpec,
          issue: textVal.length > 50 ? textVal.slice(0, 50) + "..." : textVal,
          confidence: "95%",
          recommendedSpecialist: `${detectedSpec} Advocate`,
          estFee: "₹800–₹1800",
          nextStep: `Consult a ${detectedSpec} Advocate to register documentation.`
        });

        setAiLoading(false);
      }, 1900);
    } catch (err) {
      console.error(err);
      setAiLoading(false);
    }
  };

  const handleAiRecommend = (e) => {
    if (e) e.preventDefault();
    if (!aiQuery.trim()) return;
    triggerAiMatchForText(aiQuery);
  };

  const confirmAppointmentBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingSlot) {
      alert("Please choose a date and slot.");
      return;
    }
    setBookingLoading(true);

    try {
      const bookRes = await axios.post('/api/appointments/book', {
        lawyerId: bookingLawyer.id,
        appointmentDate: bookingDate,
        timeSlot: bookingSlot,
        notes: caseDesc
      });

      const appt = bookRes.data;

      // Initiate mock Razorpay
      const payInit = await axios.post(`/api/appointments/${appt.id}/payment/initiate`);
      const orderId = payInit.data.orderId;

      // Complete mock payment
      const payComplete = await axios.post(`/api/appointments/${appt.id}/payment/complete`, {
        paymentId: 'pay_mock_' + Math.random().toString(36).substring(2, 10)
      });

      setBookedAppointment(payComplete.data);
      setBookingStep(6); // Success step screen
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Booking slot conflicts. Select a different date or time slot.");
    } finally {
      setBookingLoading(false);
    }
  };

  const triggerDownloadConfirmation = () => {
    if (!bookedAppointment) return;
    const details = `CitizenLex Consultation Confirmation
---------------------------------------------
Appointment ID: APPT-${bookedAppointment.id}
Advocate Name: Advocate ${bookedAppointment.lawyer?.user?.firstName} ${bookedAppointment.lawyer?.user?.lastName}
Date: ${bookedAppointment.appointmentDate}
Time Slot: ${bookedAppointment.timeSlot}
Consultation Mode: Secure Virtual Teleconsultation
Secure Meeting URL: ${bookedAppointment.meetingUrl || 'https://meet.jit.si/'}
---------------------------------------------
Thank you for booking through CitizenLex.`;

    const blob = new Blob([details], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CitizenLex_Appointment_${bookedAppointment.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-5 text-start" style={{ position: 'relative', color: '#fff' }}>
      
      {/* Background glow orbs */}
      <div className="glow-orb" style={{
        top: '10%',
        right: '15%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
      }} />
      <div className="glow-orb" style={{
        top: '40%',
        left: '5%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
      }} />

      {/* Primary AI Matching Dashboard Console */}
      <div className="row mb-4 fade-in-el">
        <div className="col-12">
          <div className="glass-panel p-4 p-md-5" style={{
            borderRadius: '28px',
            background: 'linear-gradient(135deg, rgba(6, 8, 20, 0.8) 0%, rgba(20, 18, 55, 0.4) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.15)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <div className="d-flex align-items-center gap-2.5 mb-3">
              <span className="badge px-3 py-1.5 fw-bold rounded-pill" style={{
                background: 'rgba(212, 175, 55, 0.12)',
                color: '#d4af37',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                fontSize: '0.78rem',
                letterSpacing: '0.5px'
              }}>
                <i className="bi bi-robot me-1.5"></i> COGNITIVE CASE DIAGNOSTIC CENTER
              </span>
            </div>

            <h1 className="fw-extrabold text-white mb-2" style={{ letterSpacing: '-1.5px', fontSize: '2.6rem' }}>
              Describe Your Legal Problem
            </h1>
            <p className="text-secondary mb-4" style={{ maxWidth: '660px', fontSize: '0.94rem', lineHeight: '1.6' }}>
              State your dispute in plain language. The CitizenLex cognitive engine analyzes core facts, checks local Bar jurisdictions, and presents matched advocates with diagnostic scoring.
            </p>

            {/* AI Console Bar */}
            <form onSubmit={handleAiRecommend} className="position-relative mb-4">
              <div className="p-2 rounded-4 d-flex align-items-center gap-2" style={{
                background: 'rgba(2, 3, 12, 0.5)',
                border: '1.5px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)'
              }}>
                <i className="bi bi-magic text-warning fs-4 ms-3 flex-shrink-0"></i>
                <textarea
                  className="form-control bg-transparent border-0 text-white flex-grow-1 py-2 px-2"
                  rows="2"
                  placeholder="Describe details (e.g. My landlord in Madurai is withholding my rent deposit)..."
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  style={{ resize: 'none', minHeight: '56px', boxShadow: 'none', fontSize: '0.94rem' }}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="btn d-flex align-items-center justify-content-center text-dark fw-extrabold px-4 h-100 py-3 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #d4af37, #f59e0b)',
                    borderRadius: '12px',
                    minHeight: '52px',
                    border: 'none'
                  }}
                >
                  {aiLoading ? 'Diagnosing...' : <>Analyze Grievance <i className="bi bi-arrow-right ms-1.5"></i></>}
                </button>
              </div>
            </form>

            {/* Case presets suggestions */}
            <div className="mb-2">
              <span className="small text-secondary fw-semibold d-block mb-2">Select a preset to test case matching:</span>
              <div className="d-flex flex-wrap gap-2">
                {casePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => triggerPresetSearch(preset.query)}
                    className="btn btn-sm btn-glass-secondary text-white text-start py-1.5 px-3"
                    style={{
                      fontSize: '0.78rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    💡 {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holographic Diagnostic Terminal Progress Loader */}
      {aiLoading && (
        <div className="row mb-4 fade-in-el">
          <div className="col-12">
            <div className="glass-panel p-4" style={{
              borderRadius: '20px',
              background: 'rgba(2, 3, 10, 0.9)',
              border: '1.5px solid rgba(0, 210, 255, 0.35)',
              boxShadow: '0 10px 40px rgba(0, 210, 255, 0.15)'
            }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="spinner-border spinner-border-sm text-info" role="status"></div>
                <h6 className="fw-bold text-white mb-0 uppercase tracking-wider">AI Case Diagnostic Processing Logs...</h6>
              </div>
              <div className="p-3 rounded-3" style={{ background: '#03050f', fontFamily: 'monospace', fontSize: '0.82rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                {diagnosticStepsList.map((step, idx) => {
                  const isActive = idx === diagnosticStep;
                  const isDone = idx < diagnosticStep;
                  return (
                    <div key={idx} className="mb-1.5 d-flex align-items-center justify-content-between">
                      <span style={{ color: isDone ? '#10b981' : isActive ? '#00d2ff' : '#6b7280' }}>
                        {step}
                      </span>
                      <span className="fw-bold" style={{ color: isDone ? '#10b981' : isActive ? '#00d2ff' : '#6b7280' }}>
                        {isDone ? '[ COMPLETED ]' : isActive ? '[ RUNNING... ]' : '[ PENDING ]'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="progress mt-3" style={{ height: '4px', background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                  role="progressbar"
                  style={{ width: `${(diagnosticStep + 1) * 25}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. AI Analysis Summary Card */}
      {diagnosticSummary && !aiLoading && (
        <div className="row mb-4 fade-in-el">
          <div className="col-12">
            <div className="glass-panel p-4" style={{
              borderRadius: '20px',
              border: '1.5px solid rgba(212, 175, 55, 0.3)',
              background: 'linear-gradient(135deg, rgba(20, 18, 55, 0.45) 0%, rgba(8, 10, 24, 0.5) 100%)',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.08)'
            }}>
              <h5 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-cpu text-warning"></i>
                Cognitive Case Analysis Summary
              </h5>
              <div className="row g-3">
                <div className="col-sm-6 col-md-4 text-start">
                  <span className="small text-secondary fw-semibold">Legal Category</span>
                  <div className="fw-bold text-white fs-6">{diagnosticSummary.category}</div>
                </div>
                <div className="col-sm-6 col-md-4 text-start">
                  <span className="small text-secondary fw-semibold">Detected Issue</span>
                  <div className="fw-bold text-white fs-6 text-truncate" style={{ maxWidth: '280px' }}>{diagnosticSummary.issue}</div>
                </div>
                <div className="col-sm-6 col-md-2 text-start">
                  <span className="small text-secondary fw-semibold">Confidence</span>
                  <div className="fw-bold text-info fs-6">{diagnosticSummary.confidence}</div>
                </div>
                <div className="col-sm-6 col-md-2 text-start">
                  <span className="small text-secondary fw-semibold">Fee Estimate</span>
                  <div className="fw-bold text-success fs-6">{diagnosticSummary.estFee}</div>
                </div>
                <div className="col-md-6 text-start mt-2">
                  <span className="small text-secondary fw-semibold">Recommended Specialist</span>
                  <div className="fw-bold text-warning">{diagnosticSummary.recommendedSpecialist}</div>
                </div>
                <div className="col-md-6 text-start mt-2">
                  <span className="small text-secondary fw-semibold">Suggested Next Step</span>
                  <div className="text-secondary small">{diagnosticSummary.nextStep}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Actions: Toggle Filters Drawer & Map splitting layout */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${showFilters ? 'btn-warning text-dark fw-bold' : 'btn-glass text-white'}`}
          style={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <i className="bi bi-sliders2-vertical"></i>
          <span>{showFilters ? 'Hide Advanced Filters' : 'Refine Diagnostic Filters'}</span>
        </button>

        <div className="d-flex gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn btn-sm btn-glass text-white d-flex align-items-center gap-1.5 px-3 py-2"
            style={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <i className={showMap ? "bi bi-map-fill text-info" : "bi bi-map"}></i>
            <span>{showMap ? "Hide Map Canvas" : "Show Map Canvas"}</span>
          </button>
        </div>
      </div>

      {/* Accordion collapsable filters drawer */}
      {showFilters && (
        <div className="row mb-4 fade-in-el">
          <div className="col-12">
            <div className="glass-panel p-4" style={{
              borderRadius: '20px',
              border: '1.5px solid rgba(255,255,255,0.08)',
              background: 'rgba(8, 10, 24, 0.6)'
            }}>
              <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-funnel text-primary"></i> Advanced Parameter Refinements
              </h6>

              <div className="row g-3">
                <div className="col-md-3 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">State Jurisdiction</label>
                  <select className="form-select form-glass-control" value={selectedState} onChange={e => setSelectedState(e.target.value)} style={{ background: '#07061d', color: '#fff' }}>
                    <option value="">All States</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                  </select>
                </div>

                <div className="col-md-3 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">District / City</label>
                  <select className="form-select form-glass-control" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} style={{ background: '#07061d', color: '#fff' }}>
                    <option value="">All Districts</option>
                    {districtsList.map((d, idx) => (
                      <option key={idx} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">Practice Specialization</label>
                  <select className="form-select form-glass-control" value={specializationId} onChange={e => setSpecializationId(e.target.value)} style={{ background: '#07061d', color: '#fff' }}>
                    <option value="">All Specializations</option>
                    {specializations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">Sort Profiles</label>
                  <select className="form-select form-glass-control" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#07061d', color: '#fff' }}>
                    <option value="id_desc">Default (Latest)</option>
                    <option value="fee_asc">Fee: Low to High</option>
                    <option value="experience_desc">Experience: High to Low</option>
                    <option value="rating_desc">Rating: High to Low</option>
                  </select>
                </div>

                <div className="col-md-4 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">Advocate Name / Court Search</label>
                  <input type="text" className="form-control form-glass-control" placeholder="Search court name..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <div className="col-md-2 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">Max Fee (₹)</label>
                  <input type="number" className="form-control form-glass-control" placeholder="e.g. 2000" value={maxFee} onChange={e => setMaxFee(e.target.value)} />
                </div>

                <div className="col-md-2 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">Min Experience</label>
                  <input type="number" className="form-control form-glass-control" placeholder="Years" value={minExperience} onChange={e => setMinExperience(e.target.value)} />
                </div>

                <div className="col-md-4 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">Languages Spoken</label>
                  <input type="text" className="form-control form-glass-control" placeholder="e.g. Tamil" value={language} onChange={e => setLanguage(e.target.value)} />
                </div>

                <div className="col-md-12 d-flex gap-4 mt-2">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="availToday" checked={availableToday} onChange={e => setAvailableToday(e.target.checked)} />
                    <label className="form-check-label small text-secondary fw-semibold" htmlFor="availToday">Available Today</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="onlineConsult" checked={onlineConsultation} onChange={e => setOnlineConsultation(e.target.checked)} />
                    <label className="form-check-label small text-secondary fw-semibold" htmlFor="onlineConsult">Online Video Consultations</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Splitscreen View: Map + Cards list */}
      <div className="row g-4">
        
        {/* Left Side: Advocates matching list */}
        <div className={showMap ? "col-lg-7" : "col-lg-12"}>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-white mb-0">
              <i className="bi bi-shield-check text-success me-2"></i>
              Advocate Matches ({lawyers.length})
            </h6>
          </div>

          {loading ? (
            <div className="d-flex flex-column gap-3">
              {[1, 2, 3].map(i => (
                <div className="glass-panel p-4" key={i} style={{ height: '140px', borderRadius: '18px' }}>
                  <div className="skeleton-loader mb-2" style={{ height: '20px', width: '40%' }}></div>
                  <div className="skeleton-loader" style={{ height: '14px', width: '60%' }}></div>
                </div>
              ))}
            </div>
          ) : lawyers.length === 0 ? (
            
            /* 7. Empty State Refinement */
            <div className="glass-panel text-center py-5 px-4 text-secondary" style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="bi bi-shield-slash fs-1 d-block mb-3 text-warning opacity-75"></i>
              <h5 className="text-white fw-bold">No exact match was found in your selected district.</h5>
              <p className="small mb-4 text-secondary">Broaden your search criteria or enable digital teleconsultation filters below to connect with statewide advocates.</p>
              
              <div className="d-flex flex-wrap gap-2.5 justify-content-center">
                <button
                  type="button"
                  onClick={() => { setOnlineConsultation(true); setSelectedDistrict(''); }}
                  className="btn btn-sm btn-glass text-info border border-info"
                  style={{ borderRadius: '10px' }}
                >
                  <i className="bi bi-camera-video-fill me-1.5"></i> Enable Online Consultation (Statewide)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDistrict('Chennai')}
                  className="btn btn-sm btn-glass text-white border border-light-subtle"
                  style={{ borderRadius: '10px' }}
                >
                  <i className="bi bi-geo-alt-fill me-1.5"></i> Switch to Chennai (HQ Jurisdiction)
                </button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {lawyers.map((lawyer, index) => {
                const hasAiMatch = aiRecommendedIds.has(lawyer.id);
                const aiMatch = aiMatchReasons[lawyer.id];

                // 2. Lawyer Ranking Badges
                let rankBadge = "";
                let rankStyle = {};
                if (index === 0) {
                  rankBadge = "🥇 Best Match";
                  rankStyle = { border: '1.5px solid #d4af37', background: 'rgba(212, 175, 55, 0.05)' };
                } else if (index === 1) {
                  rankBadge = "🥈 Strong Match";
                  rankStyle = { border: '1.5px solid #c0c0c0', background: 'rgba(192, 192, 192, 0.05)' };
                } else {
                  rankBadge = "🥉 Alternative Match";
                  rankStyle = { border: '1.5px solid #cd7f32', background: 'rgba(205, 127, 50, 0.04)' };
                }

                return (
                  <div
                    key={lawyer.id}
                    onClick={() => focusLawyer(lawyer)}
                    onMouseEnter={() => setHoveredLawyerId(lawyer.id)}
                    onMouseLeave={() => setHoveredLawyerId(null)}
                    className="glass-panel p-4 animate-hover position-relative"
                    style={{
                      borderRadius: '20px',
                      ...rankStyle,
                      border: selectedLawyerId === lawyer.id ? '2px solid #00d2ff' : rankStyle.border,
                      boxShadow: selectedLawyerId === lawyer.id ? '0 0 16px rgba(0, 210, 255, 0.15)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    <span className="badge position-absolute" style={{
                      top: '16px', right: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#9aa5b1',
                      fontSize: '0.68rem'
                    }}>
                      {rankBadge}
                    </span>

                    <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
                      {/* Left details */}
                      <div className="d-flex align-items-center gap-3 text-start">
                        {lawyer.user?.profileImageUrl ? (
                          <img src={lawyer.user.profileImageUrl} alt="Lawyer" style={{ width: '70px', height: '70px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(212, 175, 55, 0.3)' }} />
                        ) : (
                          <div style={{
                            width: '70px', height: '70px', borderRadius: '14px',
                            background: 'linear-gradient(135deg, #d4af37, #f59e0b)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', fontWeight: 700, color: '#000'
                          }}>
                            {lawyer.user?.firstName?.[0] || 'L'}
                          </div>
                        )}
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <h5 className="fw-bold text-white mb-0" style={{ fontSize: '1.05rem' }}>Advocate {lawyer.user?.firstName} {lawyer.user?.lastName}</h5>
                            {lawyer.isVerified && (
                              <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1" style={{ fontSize: '0.65rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <i className="bi bi-patch-check-fill"></i> Verified
                              </span>
                            )}
                          </div>

                          <p className="text-secondary small mb-2 fw-semibold" style={{ fontSize: '0.78rem' }}>
                            {lawyer.specialization?.name} | Bar Reg: {lawyer.advocateId}
                          </p>

                          {/* 4. Real-Time Availability Slot */}
                          <div className="text-info mb-1.5" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                            <i className="bi bi-clock-fill text-info me-1"></i>
                            Next Available: <span className="text-white fw-bold">{getNextAvailableSlot(lawyer.id)}</span>
                          </div>

                          <div className="d-flex flex-wrap gap-2.5 align-items-center text-white-50" style={{ fontSize: '0.78rem' }}>
                            <span><i className="bi bi-briefcase me-1 text-primary"></i>{lawyer.experienceYears} Years Exp</span>
                            <span className="text-secondary">|</span>
                            <span><i className="bi bi-star-fill text-warning me-1"></i>{lawyer.rating} ({lawyer.totalReviews} reviews)</span>
                            <span className="text-secondary">|</span>
                            <span><i className="bi bi-geo-alt me-1 text-primary"></i>{lawyer.city?.name || 'Tamil Nadu'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="d-flex flex-row flex-md-column gap-2 justify-content-end align-items-stretch" style={{ minWidth: '180px' }}>
                        <div className="text-md-end mb-1">
                          <span className="small text-secondary">Consultation Fee</span>
                          <h4 className="fw-extrabold text-white mb-0" style={{ letterSpacing: '-0.5px' }}>₹{lawyer.consultationFee}</h4>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); focusLawyer(lawyer); }}
                              className="btn btn-sm btn-glass text-white d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center"
                              style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.78rem' }}
                            >
                              <i className="bi bi-geo-alt-fill text-danger"></i> Locate
                            </button>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${getLawyerLatLng(lawyer).lat},${getLawyerLatLng(lawyer).lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-glass text-white d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center"
                              style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.78rem' }}
                            >
                              <i className="bi bi-compass-fill text-info"></i> Maps
                            </a>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); setBookingLawyer(lawyer); setBookingStep(1); }}
                            className="btn btn-sm text-dark fw-bold d-flex align-items-center justify-content-center gap-1.5"
                            style={{
                              background: 'linear-gradient(135deg, #a855f7, #f59e0b)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '0.82rem'
                            }}
                          >
                            <i className="bi bi-calendar-event-fill"></i> Book Appointment
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Lawyer Preview on hover inline drawer expansion */}
                    <div style={{
                      maxHeight: hoveredLawyerId === lawyer.id ? '220px' : '0px',
                      opacity: hoveredLawyerId === lawyer.id ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'all 0.35s ease-in-out',
                      marginTop: hoveredLawyerId === lawyer.id ? '15px' : '0px',
                      borderTop: hoveredLawyerId === lawyer.id ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      paddingTop: hoveredLawyerId === lawyer.id ? '15px' : '0px'
                    }}>
                      <h6 className="text-warning fw-bold mb-2 small"><i className="bi bi-info-circle me-1.5"></i>Quick Advocate Diagnostics Summary</h6>
                      <div className="row g-2 text-start small">
                        <div className="col-6"><strong>Practice Specializations:</strong> {lawyer.specialization?.name}</div>
                        <div className="col-6"><strong>Languages Spoken:</strong> {lawyer.languages || "English, Tamil"}</div>
                        <div className="col-12"><strong>Office Address:</strong> {lawyer.officeAddress || "Court Chambers block"}</div>
                        <div className="col-6"><strong>Total Case Reviews:</strong> {lawyer.totalReviews || 0} Clients</div>
                        <div className="col-6"><strong>Bio Summary:</strong> {lawyer.bio ? lawyer.bio.slice(0, 75) + "..." : "No additional bio logs."}</div>
                      </div>
                    </div>

                    {/* AI matching reason argument bubble */}
                    {hasAiMatch && aiMatch && (
                      <div className="mt-3 p-3 rounded-4" style={{
                        background: 'rgba(212, 175, 55, 0.05)',
                        border: '1px solid rgba(212, 175, 55, 0.25)'
                      }}>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <i className="bi bi-robot text-warning"></i>
                          <span className="fw-extrabold small text-white">AI Diagnostic Match Score: {aiMatch.score}</span>
                        </div>
                        <p className="small text-secondary mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.5' }}>{aiMatch.reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Map Canvas */}
        {showMap && (
          <div className="col-lg-5">
            <div className="glass-panel p-3 sticky-top" style={{ top: '100px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2.5">
                <h6 className="fw-bold text-white mb-0"><i className="bi bi-geo-alt-fill text-danger me-2"></i>Geolocation & Jurisdiction Map</h6>
                <select className="form-select form-glass-control py-1 px-2.5 small" value={nearbyType} onChange={e => setNearbyType(e.target.value)} style={{ width: '160px', fontSize: '0.78rem', background: '#07061d', color: 'white' }}>
                  <option value="court">Search Courts</option>
                  <option value="police">Search Police Stations</option>
                  <option value="legal_aid">Search Legal Aid Centres</option>
                </select>
              </div>

              {/* Autocomplete location input */}
              <div className="position-relative mb-2.5">
                <i className="bi bi-search position-absolute" style={{ left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }}></i>
                <input
                  ref={autocompleteInputRef}
                  type="text"
                  className="form-control form-glass-control ps-4.5 py-1.5 text-white"
                  placeholder="Focus maps on another district/address..."
                  style={{ borderRadius: '8px', fontSize: '0.82rem' }}
                />
              </div>

              <div ref={mapRef} style={{ height: '420px', width: '100%', borderRadius: '16px' }} />

              {/* Directions overlay panel */}
              {directionsInfo && (
                <div className="p-3 mt-3 rounded-4 bg-glass border border-light-subtle d-flex justify-content-between align-items-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <h6 className="fw-bold text-white mb-0.5">Route to Advocate {directionsInfo.lawyerName}</h6>
                    <p className="text-secondary small mb-0">Distance: <span className="text-white fw-bold">{directionsInfo.distance}</span> | Est. Duration: <span className="text-white fw-bold">{directionsInfo.duration}</span></p>
                  </div>
                  <button onClick={() => {
                    setDirectionsInfo(null);
                    directionsRendererRef.current.setDirections({ routes: [] });
                  }} className="btn btn-sm btn-link text-white-50 text-decoration-none">Clear</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= 5. BETTER BOOKING FLOW OVERLAY WIZARD ================= */}
      {bookingLawyer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(2, 3, 10, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 1050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel p-4" style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            borderRadius: '24px',
            border: '1.5px solid rgba(212, 175, 55, 0.25)',
            background: '#080a18',
            textAlign: 'left'
          }}>
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-white mb-0">
                <i className="bi bi-calendar2-check-fill text-warning me-2"></i>
                AI Smart Scheduler
              </h5>
              <button onClick={() => { setBookingLawyer(null); setBookingStep(1); }} className="btn-close btn-close-white"></button>
            </div>

            {/* Booking Progress Step Indicator */}
            {bookingStep <= 5 && (
              <div className="mb-4">
                <div className="d-flex justify-content-between text-secondary mb-2" style={{ fontSize: '0.72rem' }}>
                  <span className={bookingStep >= 1 ? "text-warning fw-bold" : ""}>1. Review</span>
                  <span className={bookingStep >= 2 ? "text-warning fw-bold" : ""}>2. Date</span>
                  <span className={bookingStep >= 3 ? "text-warning fw-bold" : ""}>3. Time</span>
                  <span className={bookingStep >= 4 ? "text-warning fw-bold" : ""}>4. Contact</span>
                  <span className={bookingStep >= 5 ? "text-warning fw-bold" : ""}>5. Payment</span>
                </div>
                <div className="progress" style={{ height: '4px', background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${bookingStep * 20}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* STEP 1: REVIEW LAWYER */}
            {bookingStep === 1 && (
              <div>
                <h6 className="fw-bold text-white mb-3 text-start">Step 1: Review Lawyer Profile & Fee</h6>
                <div className="d-flex align-items-center gap-3 p-3 rounded-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img
                    src={bookingLawyer.user?.profileImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50'}
                    alt="Lawyer"
                    style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }}
                  />
                  <div>
                    <h6 className="fw-bold text-white mb-0">Advocate {bookingLawyer.user?.firstName} {bookingLawyer.user?.lastName}</h6>
                    <p className="text-secondary small mb-1">{bookingLawyer.specialization?.name}</p>
                    <div className="fw-bold text-warning" style={{ fontSize: '0.85rem' }}>Standard Consultation: ₹{bookingLawyer.consultationFee}</div>
                  </div>
                </div>
                <div className="text-secondary small mb-4 text-start" style={{ lineHeight: '1.6' }}>
                  Advocate {bookingLawyer.user?.firstName} is a verified {bookingLawyer.specialization?.name} specialist with {bookingLawyer.experienceYears} years of Bar practice. Proceed to select your consultation date.
                </div>
                <button
                  type="button"
                  onClick={() => setBookingStep(2)}
                  className="btn btn-premium-gold w-100 py-2.5 text-dark fw-bold"
                >
                  Continue to Select Date <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            )}

            {/* STEP 2: CHOOSE DATE */}
            {bookingStep === 2 && (
              <div>
                <h6 className="fw-bold text-white mb-3 text-start">Step 2: Choose Consultation Date</h6>
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary mb-1">Select Date</label>
                  <input
                    type="date"
                    className="form-control form-glass-control text-white"
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="button" onClick={() => setBookingStep(1)} className="btn btn-glass-secondary flex-grow-1" style={{ color: 'white' }}>Back</button>
                  <button
                    type="button"
                    disabled={!bookingDate}
                    onClick={() => setBookingStep(3)}
                    className="btn btn-premium-gold flex-grow-1 py-2.5 text-dark fw-bold"
                  >
                    Select Time Slot <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CHOOSE TIME */}
            {bookingStep === 3 && (
              <div>
                <h6 className="fw-bold text-white mb-3 text-start">Step 3: Choose Time Slot</h6>
                <div className="mb-4 text-start">
                  <label className="form-label small fw-semibold text-secondary mb-1">Available slots for {bookingDate}</label>
                  <div className="d-flex flex-column gap-2">
                    {timeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBookingSlot(slot)}
                        className="btn text-start p-2.5"
                        style={{
                          borderRadius: '10px',
                          border: bookingSlot === slot ? '1.5px solid #d4af37' : '1px solid rgba(255,255,255,0.06)',
                          background: bookingSlot === slot ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.01)',
                          color: bookingSlot === slot ? '#d4af37' : '#fff'
                        }}
                      >
                        <i className={`bi ${bookingSlot === slot ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" onClick={() => setBookingStep(2)} className="btn btn-glass-secondary flex-grow-1" style={{ color: 'white' }}>Back</button>
                  <button
                    type="button"
                    disabled={!bookingSlot}
                    onClick={() => setBookingStep(4)}
                    className="btn btn-premium-gold flex-grow-1 py-2.5 text-dark fw-bold"
                  >
                    Continue to Details <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CONTACT INFORMATION */}
            {bookingStep === 4 && (
              <div>
                <h6 className="fw-bold text-white mb-3 text-start">Step 4: Contact & Grievance Details</h6>
                <div className="row g-2 mb-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary mb-1">Full Name</label>
                    <input type="text" className="form-control form-glass-control" value={clientName} onChange={e => setClientName(e.target.value)} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Phone Number</label>
                    <input type="tel" className="form-control form-glass-control" value={clientPhone} onChange={e => setClientPhone(e.target.value)} required />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-secondary mb-1">Email Address</label>
                    <input type="email" className="form-control form-glass-control" value={clientEmail} onChange={e => setClientEmail(e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary mb-1">Brief Description of Grievance</label>
                    <textarea className="form-control form-glass-control" rows="2" placeholder="Explain details..." value={caseDesc} onChange={e => setCaseDesc(e.target.value)} />
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" onClick={() => setBookingStep(3)} className="btn btn-glass-secondary flex-grow-1" style={{ color: 'white' }}>Back</button>
                  <button
                    type="button"
                    onClick={() => setBookingStep(5)}
                    className="btn btn-premium-gold flex-grow-1 py-2.5 text-dark fw-bold"
                  >
                    Proceed to Payment <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: SIMULATED PAYMENT */}
            {bookingStep === 5 && (
              <form onSubmit={confirmAppointmentBooking}>
                <h6 className="fw-bold text-white mb-3 text-start">Step 5: Razorpay Gateway Payment</h6>
                
                <div className="p-3 rounded-4 mb-4 text-start" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary small">Consultation Fee</span>
                    <span className="text-white fw-bold">₹{bookingLawyer.consultationFee}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-secondary small">Service Tax & Platform Fee</span>
                    <span className="text-white fw-bold">₹0.00</span>
                  </div>
                  <hr className="border-secondary" />
                  <div className="d-flex justify-content-between">
                    <span className="text-secondary small">Total Amount Payable</span>
                    <span className="text-warning fw-bold fs-5">₹{bookingLawyer.consultationFee}</span>
                  </div>
                </div>

                <div className="form-check text-start mb-4">
                  <input className="form-check-input" type="checkbox" id="authTerms" defaultChecked required />
                  <label className="form-check-label small text-secondary" htmlFor="authTerms">
                    I authorize CitizenLex to schedule a secure teleconsultation room and confirm that the payment details are correct.
                  </label>
                </div>

                <div className="d-flex gap-2">
                  <button type="button" onClick={() => setBookingStep(4)} className="btn btn-glass-secondary flex-grow-1" style={{ color: 'white' }}>Back</button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="btn btn-premium-gold flex-grow-1 py-2.5 text-dark fw-bold"
                  >
                    {bookingLoading ? 'Authorizing...' : 'Authorize & Confirm'}
                  </button>
                </div>
              </form>
            )}

            {/* 6. BOOKING SUCCESS VIEW */}
            {bookingStep === 6 && bookedAppointment && (
              <div className="text-center py-3">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                <h4 className="fw-extrabold text-white mt-3 mb-2">Payment & Scheduling Success!</h4>
                <p className="text-secondary small mb-4">Your virtual consultation room has been locked and registered in the database.</p>

                {/* Details Card */}
                <div className="p-3 rounded-4 mb-4 text-start" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                  <div className="mb-2"><span className="text-secondary">Appointment ID:</span> <strong className="text-white">APPT-{bookedAppointment.id}</strong></div>
                  <div className="mb-2"><span className="text-secondary">Advocate Name:</span> <strong className="text-white">Advocate {bookedAppointment.lawyer?.user?.firstName} {bookedAppointment.lawyer?.user?.lastName}</strong></div>
                  <div className="mb-2"><span className="text-secondary">Date:</span> <strong className="text-white">{bookedAppointment.appointmentDate}</strong></div>
                  <div className="mb-2"><span className="text-secondary">Time Slot:</span> <strong className="text-white">{bookedAppointment.timeSlot}</strong></div>
                  <div className="mb-2"><span className="text-secondary">Consultation Mode:</span> <strong className="text-info"><i className="bi bi-camera-video-fill"></i> Secure Video Consult</strong></div>
                  {bookedAppointment.meetingUrl && (
                    <div className="mb-1"><span className="text-secondary">Secure Jitsi Link:</span> <a href={bookedAppointment.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-warning fw-bold text-decoration-none d-block mt-1 text-truncate">{bookedAppointment.meetingUrl}</a></div>
                  )}
                </div>

                <div className="d-flex flex-column gap-2">
                  {/* View Dashboard */}
                  <button
                    onClick={() => { setBookingLawyer(null); setBookingStep(1); navigate('/dashboard'); }}
                    className="btn btn-premium-gold py-2.5 text-dark fw-bold"
                  >
                    Go to User Dashboard <i className="bi bi-grid-fill ms-1"></i>
                  </button>

                  <div className="d-flex gap-2">
                    {/* Download Confirmation */}
                    <button
                      onClick={triggerDownloadConfirmation}
                      className="btn btn-sm btn-glass text-white border border-light-subtle flex-grow-1 py-2"
                    >
                      <i className="bi bi-download me-1"></i> Confirmation Slip
                    </button>
                    {/* Find Another Lawyer */}
                    <button
                      onClick={() => { setBookingLawyer(null); setBookingStep(1); }}
                      className="btn btn-sm btn-glass text-white border border-light-subtle flex-grow-1 py-2"
                    >
                      Book Another Advocate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
