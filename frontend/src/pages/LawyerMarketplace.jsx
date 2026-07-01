import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function LawyerMarketplace() {
  const [lawyers, setLawyers] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScriptLoaded, setIsScriptLoaded] = useState(!!window.google);

  // --- Search & Filters State ---
  const [search, setSearch] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [cityId, setCityId] = useState('');
  const [language, setLanguage] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('id_desc');

  // AI Recommendation input
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // --- Google Maps & Autocomplete ---
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
  const lawyerMarkersRef = useRef([]);
  const autocompleteInputRef = useRef(null);

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

      const res = await axios.get('/api/lawyers', { params });
      setLawyers(res.data || []);
      
      // Update markers on Google Map
      plotLawyerMarkers(res.data || []);
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
  }, [specializationId, cityId, language, minExperience, maxFee, minRating, sortBy]);

  // Load Google Maps script
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

  // Initialize Map when script is loaded and DOM ref is ready
  useEffect(() => {
    if (isScriptLoaded && mapRef.current && !map) {
      initializeMap();
    }
  }, [isScriptLoaded, map, mapRef]);

  const getLawyerLatLng = (lawyer, center) => {
    const latBase = center?.lat || 13.0827;
    const lngBase = center?.lng || 80.2707;
    
    // Deterministic offset based on lawyer ID to prevent marker layout drift
    const seed = (lawyer.id || 1) * 123.456;
    const offsetLat = Math.sin(seed) * 0.015;
    const offsetLng = Math.cos(seed) * 0.015;
    
    return {
      lat: latBase + offsetLat,
      lng: lngBase + offsetLng
    };
  };

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    // Default center Chennai
    const defaultLatLng = { lat: 13.0827, lng: 80.2707 };

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultLatLng,
      zoom: 12,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1e1b4b" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1e1b4b" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#a5b4fc" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#312e81" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#312e81" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] }
      ]
    });

    // Directions renderer
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
        }
      });
    }

    // Get current location with timeout config
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

          // Fetch nearby courts/police stations
          searchNearbyLegalPlaces(mapInstance, userLatLng, nearbyType);
        },
        (error) => {
          console.warn("Geolocation denied, timed out, or unavailable:", error.message);
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

    // Clear existing markers
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

    // Clear existing lawyer markers
    lawyerMarkersRef.current.forEach(m => m.setMap(null));
    lawyerMarkersRef.current = [];

    if (lawyerList.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;

    if (userLocation) {
      bounds.extend(userLocation);
      hasValidBounds = true;
    }

    lawyerList.forEach((lawyer) => {
      const lawyerLatLng = getLawyerLatLng(lawyer, userLocation || { lat: 13.0827, lng: 80.2707 });
      
      bounds.extend(lawyerLatLng);
      hasValidBounds = true;

      const marker = new window.google.maps.Marker({
        position: lawyerLatLng,
        map: map,
        title: `Advocate ${lawyer.user?.firstName || 'Lawyer'} ${lawyer.user?.lastName || ''}`,
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
      });

      const contentString = `
        <div style="color: #030712; padding: 12px; font-family: sans-serif; text-align: left; min-width: 220px; overflow: hidden;">
          <div style="margin-bottom: 8px; overflow: hidden;">
            <img src="${lawyer.user?.profileImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50'}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; float: left; margin-right: 10px; border: 1.5px solid #6366f1;" />
            <div style="float: left; width: 140px;">
              <h6 style="margin: 0 0 2px 0; font-weight: bold; color: #1e1b4b; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Advocate ${lawyer.user?.firstName || ''} ${lawyer.user?.lastName || ''}</h6>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #4b5563; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${lawyer.specialization?.name || 'Practice Area'}</p>
              <div style="font-size: 10px; color: #6b7280; font-weight: 500;">
                <i class="bi bi-geo-alt-fill text-danger"></i> ${lawyer.city?.name || 'Tamil Nadu'}
              </div>
            </div>
          </div>
          <div style="font-size: 11px; margin-bottom: 10px; clear: both; border-top: 1px solid #f3f4f6; padding-top: 6px; color: #374151;">
            <strong>Experience:</strong> ${lawyer.experienceYears || 0} Years <br/>
            <strong>Fee:</strong> ₹${lawyer.consultationFee || 0} | <strong>Rating:</strong> ⭐ ${lawyer.rating || 5.0}
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="/lawyers/${lawyer.id}" style="flex: 1; text-align: center; background: #e0e7ff; color: #4338ca; padding: 6px 4px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold; border: 1px solid #c7d2fe;">View Profile</a>
            <a href="/lawyers/${lawyer.id}?book=true" style="flex: 1; text-align: center; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; padding: 6px 4px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold; box-shadow: 0 3px 6px rgba(99,102,241,0.2);">Book Appt</a>
          </div>
        </div>
      `;

      const infowindow = new window.google.maps.InfoWindow({
        content: contentString,
      });

      marker.addListener("click", () => {
        infowindow.open({
          anchor: marker,
          map,
        });
      });

      lawyerMarkersRef.current.push(marker);
    });

    if (hasValidBounds) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(map, "idle", () => {
        if (map.getZoom() > 14) map.setZoom(14);
        window.google.maps.event.removeListener(listener);
      });
    }
  };

  const calculateDirections = (lawyer) => {
    if (!window.google || !map || !userLocation) return;

    const destination = getLawyerLatLng(lawyer, userLocation);
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
        } else {
          console.error("Directions search failed:", status);
        }
      }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim() && !recentSearches.includes(search)) {
      const updated = [search, ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    }
    fetchLawyers();
  };

  const handleAutoSeed = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/lawyers/seed');
      alert(res.data.message || 'Demo lawyers seeded successfully!');
      fetchLawyers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to seed demo lawyers.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiRecommend = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await axios.get('/api/lawyers/recommend', { params: { query: aiQuery } });
      setLawyers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="container py-5 text-start" style={{ position: 'relative' }}>
      {/* Ambient backgrounds */}
      <div className="glow-orb" style={{
        top: '15%',
        left: '10%',
        width: '320px',
        height: '320px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
      }} />

      {/* Header Banner */}
      <div className="row mb-5 fade-in-el">
        <div className="col-12">
          <div className="glass-panel p-4 p-md-5" style={{
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(8, 10, 24, 0.6) 0%, rgba(30, 27, 75, 0.3) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span className="badge px-3 py-1.5 mb-3 fw-bold rounded-pill" style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              fontSize: '0.78rem'
            }}>
              ⚖️ LAWYER MARKETPLACE & CONSULTATION PORTAL
            </span>
            <h1 className="fw-extrabold text-white mb-2" style={{ letterSpacing: '-1px', fontSize: '2.5rem' }}>
              Find Verified Advocates
            </h1>
            <p className="text-secondary mb-4" style={{ maxWidth: '620px', lineHeight: '1.6' }}>
              Discover experienced lawyers nearby, consult instantly over secured Jitsi calls, and book appointments inside private workflows.
            </p>

            {/* AI Recommendation Box */}
            <form onSubmit={handleAiRecommend} className="p-3 rounded-4 bg-glass border border-light-subtle d-flex flex-wrap gap-2 align-items-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="d-flex align-items-center gap-2 text-white-50 flex-shrink-0">
                <i className="bi bi-robot text-primary fs-5"></i>
                <span className="small fw-bold text-white">AI Consultation Match:</span>
              </div>
              <input
                type="text"
                className="form-control form-glass-control flex-grow-1 border-0 bg-transparent px-2 text-white"
                placeholder="Describe your legal issue (e.g. Property dispute in Chennai)..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                style={{ height: '38px', boxShadow: 'none' }}
              />
              <button type="submit" className="btn btn-sm text-dark fw-bold d-flex align-items-center gap-1.5" disabled={aiLoading} style={{
                background: 'linear-gradient(135deg, #a855f7, #f59e0b)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px'
              }}>
                {aiLoading ? 'Analyzing...' : <>Recommend Lawyer <i className="bi bi-magic"></i></>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* SIDEBAR FILTERS PANEL */}
        <div className="col-lg-3">
          <div className="glass-panel p-4" style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h5 className="fw-bold text-white mb-4"><i className="bi bi-funnel text-primary me-2"></i>Filter Profiles</h5>

            {/* Specialization */}
            <div className="mb-3 text-start">
              <label className="form-label small fw-semibold text-secondary mb-1">Specialization</label>
              <select className="form-select form-glass-control" value={specializationId} onChange={e => setSpecializationId(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="" style={{ background: '#07061d' }}>All Practices</option>
                {specializations.map(s => (
                  <option key={s.id} value={s.id} style={{ background: '#07061d' }}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="mb-3 text-start">
              <label className="form-label small fw-semibold text-secondary mb-1">City</label>
              <select className="form-select form-glass-control" value={cityId} onChange={e => setCityId(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="" style={{ background: '#07061d' }}>All Cities</option>
                {cities.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#07061d' }}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div className="mb-3 text-start">
              <label className="form-label small fw-semibold text-secondary mb-1">Languages spoken</label>
              <input type="text" className="form-control form-glass-control" placeholder="e.g. Tamil" value={language} onChange={e => setLanguage(e.target.value)} />
            </div>

            {/* Fee limit */}
            <div className="mb-3 text-start">
              <label className="form-label small fw-semibold text-secondary mb-1">Max Consultation Fee (₹)</label>
              <input type="number" className="form-control form-glass-control" placeholder="e.g. 2000" value={maxFee} onChange={e => setMaxFee(e.target.value)} />
            </div>

            {/* Experience */}
            <div className="mb-3 text-start">
              <label className="form-label small fw-semibold text-secondary mb-1">Min Experience (Years)</label>
              <input type="number" className="form-control form-glass-control" placeholder="e.g. 5" value={minExperience} onChange={e => setMinExperience(e.target.value)} />
            </div>

            {/* Rating limit */}
            <div className="mb-3 text-start">
              <label className="form-label small fw-semibold text-secondary mb-1">Min Rating (Stars)</label>
              <select className="form-select form-glass-control" value={minRating} onChange={e => setMinRating(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="" style={{ background: '#07061d' }}>All Ratings</option>
                <option value="5" style={{ background: '#07061d' }}>5 Stars</option>
                <option value="4" style={{ background: '#07061d' }}>4+ Stars</option>
                <option value="3" style={{ background: '#07061d' }}>3+ Stars</option>
              </select>
            </div>

            {/* Sort */}
            <div className="mb-3 text-start">
              <label className="form-label small fw-semibold text-secondary mb-1">Sort Profiles By</label>
              <select className="form-select form-glass-control" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>
                <option value="id_desc" style={{ background: '#07061d' }}>Default</option>
                <option value="fee_asc" style={{ background: '#07061d' }}>Fee: Low to High</option>
                <option value="experience_desc" style={{ background: '#07061d' }}>Experience: High to Low</option>
                <option value="rating_desc" style={{ background: '#07061d' }}>Rating: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* LAWYERS SEARCH LIST & GOOGLE MAPS BLOCK */}
        <div className="col-lg-9">
          {/* Main search bar */}
          <form onSubmit={handleSearchSubmit} className="d-flex flex-column flex-md-row gap-2.5 mb-4">
            <div className="position-relative flex-grow-1">
              <i className="bi bi-search position-absolute" style={{ left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
              <input
                type="text"
                className="form-control form-glass-control ps-5 py-2.5"
                placeholder="Search by name, court, specialization..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ borderRadius: '12px' }}
              />
            </div>
            <div className="position-relative" style={{ minWidth: '220px' }}>
              <i className="bi bi-geo-alt position-absolute" style={{ left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
              <input
                ref={autocompleteInputRef}
                type="text"
                className="form-control form-glass-control ps-5 py-2.5"
                placeholder="Search location/address..."
                style={{ borderRadius: '12px' }}
              />
            </div>
            <button type="submit" className="btn btn-glass px-4" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}>Search</button>
          </form>

          {/* Recent searches suggestions */}
          {recentSearches.length > 0 && (
            <div className="mb-4 d-flex align-items-center gap-2 flex-wrap">
              <span className="small text-secondary fw-semibold">Recent:</span>
              {recentSearches.map((s, idx) => (
                <button key={idx} type="button" onClick={() => { setSearch(s); fetchLawyers(); }} className="btn btn-sm btn-glass text-white border-0 py-1 px-2.5" style={{ fontSize: '0.75rem', borderRadius: '8px' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Official Google Maps Platform Container */}
          <div className="glass-panel p-3 mb-4 text-start" style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
            <div className="d-flex justify-content-between align-items-center mb-2.5">
              <h6 className="fw-bold text-white mb-0"><i className="bi bi-geo-alt-fill text-danger me-2"></i>Official Google Maps Geolocation & Nearby Places</h6>
              <select className="form-select form-glass-control py-1 px-2.5 small" value={nearbyType} onChange={e => setNearbyType(e.target.value)} style={{ width: '160px', fontSize: '0.78rem', background: '#07061d', color: 'white' }}>
                <option value="court">Search Courts</option>
                <option value="police">Search Police Stations</option>
                <option value="legal_aid">Search Legal Aid Centres</option>
              </select>
            </div>

            <div ref={mapRef} id="google-map" style={{ height: '350px', width: '100%', borderRadius: '16px' }} />

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

          {/* Lawyer card grids */}
          {loading ? (
            <div className="row g-3">
              {[1, 2, 3].map(i => (
                <div className="col-12" key={i}>
                  <div className="glass-panel p-4" style={{ height: '140px', borderRadius: '18px' }}>
                    <div className="skeleton-loader mb-2" style={{ height: '20px', width: '40%' }}></div>
                    <div className="skeleton-loader mb-2" style={{ height: '14px', width: '60%' }}></div>
                    <div className="skeleton-loader" style={{ height: '12px', width: '80%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : lawyers.length === 0 ? (
            <div className="glass-panel text-center py-5 text-secondary" style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="bi bi-person-slash fs-1 d-block mb-3 opacity-25"></i>
              <h5 className="text-white fw-bold">No Lawyers Found</h5>
              <p className="small mb-3">Try refining your filter preferences or write a different search query.</p>
              <button onClick={handleAutoSeed} className="btn btn-sm btn-glass text-white border border-light-subtle px-3 py-1.5" style={{ borderRadius: '10px' }}>
                Seed Demo Dataset <i className="bi bi-database-fill-add ms-1"></i>
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {lawyers.map(lawyer => (
                <div className="col-12" key={lawyer.id}>
                  <div className="glass-panel p-4 animate-hover" style={{
                    borderRadius: '20px',
                    border: '1.5px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(8, 10, 24, 0.4)'
                  }}>
                    <div className="d-flex flex-column flex-md-row gap-4 align-items-md-center justify-content-between">
                      {/* Left: Info */}
                      <div className="d-flex align-items-center gap-3 text-start">
                        {lawyer.user?.profileImageUrl ? (
                          <img src={lawyer.user.profileImageUrl} alt="Lawyer" style={{ width: '76px', height: '76px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.3)' }} />
                        ) : (
                          <div style={{
                            width: '76px', height: '76px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem', fontWeight: 700, color: 'white'
                          }}>
                            {lawyer.user?.firstName?.[0] || 'L'}
                          </div>
                        )}
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <h5 className="fw-bold text-white mb-0">{lawyer.user?.firstName} {lawyer.user?.lastName}</h5>
                            {lawyer.isVerified && (
                              <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                                <i className="bi bi-patch-check-fill"></i> Verified
                              </span>
                            )}
                            <span style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: lawyer.isOnline ? '#10b981' : '#6b7280',
                              boxShadow: lawyer.isOnline ? '0 0 8px #10b981' : 'none'
                            }} title={lawyer.isOnline ? 'Online' : 'Offline'}></span>
                          </div>
                          
                          <p className="text-secondary small mb-2.5 fw-semibold" style={{ fontSize: '0.8rem' }}>
                            {lawyer.specialization?.name} | {lawyer.courtName || 'District Courts'}
                          </p>
 
                          <div className="d-flex flex-wrap gap-2.5 align-items-center text-white-50" style={{ fontSize: '0.78rem' }}>
                            <span><i className="bi bi-briefcase me-1 text-primary"></i>{lawyer.experienceYears} Years Exp</span>
                            <span className="text-secondary">|</span>
                            <span><i className="bi bi-translate me-1 text-primary"></i>{lawyer.languages || 'English'}</span>
                            <span className="text-secondary">|</span>
                            <span><i className="bi bi-geo-alt me-1 text-primary"></i>{lawyer.city?.name || 'Tamil Nadu'}</span>
                            <span className="text-secondary">|</span>
                            <span><i className="bi bi-star-fill text-warning me-1"></i>{lawyer.rating} ({lawyer.totalReviews} Reviews)</span>
                          </div>
                        </div>
                      </div>
 
                      {/* Right: Actions */}
                      <div className="d-flex flex-row flex-md-column gap-2 justify-content-end align-items-stretch" style={{ minWidth: '180px' }}>
                        <div className="text-md-end mb-1">
                          <span className="small text-secondary">Consultation Fee</span>
                          <h4 className="fw-extrabold text-white mb-0" style={{ letterSpacing: '-0.5px' }}>₹{lawyer.consultationFee}</h4>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex gap-2">
                            <button onClick={() => calculateDirections(lawyer)} className="btn btn-sm btn-glass text-white d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.8rem' }}>
                              <i className="bi bi-geo-alt-fill text-danger"></i> Route
                            </button>
                            <Link to="/consultations" className="btn btn-sm btn-glass text-white d-flex align-items-center gap-1.5 flex-grow-1 justify-content-center" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.8rem' }}>
                              <i className="bi bi-chat-square-dots text-info"></i> Chat
                            </Link>
                          </div>
                          <Link to={`/lawyers/${lawyer.id}?book=true`} className="btn btn-sm text-dark fw-bold d-flex align-items-center justify-content-center gap-1.5" style={{
                            background: 'linear-gradient(135deg, #a855f7, #f59e0b)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '0.82rem'
                          }}>
                            <i className="bi bi-calendar-event-fill"></i> Book Appointment
                          </Link>
                          <Link to={`/lawyers/${lawyer.id}`} className="btn btn-sm btn-glass text-white border border-light-subtle d-flex align-items-center justify-content-center gap-1.5" style={{
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '0.82rem'
                          }}>
                            <span>View Profile</span>
                            <i className="bi bi-arrow-right"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
