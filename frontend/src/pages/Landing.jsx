import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../context/PWAContext';

// ================= INTERACTIVE HOLOGRAPHIC AI ORB =================
function InteractiveAIOrb() {
  const meshRef = useRef();
  const pointsRef = useRef();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.35;
      meshRef.current.rotation.x = t * 0.15;
      
      const pulseScale = 1.4 + Math.sin(t * 1.8) * 0.06;
      meshRef.current.scale.set(pulseScale, pulseScale, pulseScale);

      // React to mouse movements slightly
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, mouse.x * 0.7, 0.05);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, mouse.y * 0.5, 0.05);
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y = -t * 0.18;
      pointsRef.current.rotation.x = t * 0.1;
      pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, mouse.x * 0.5, 0.04);
      pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, mouse.y * 0.4, 0.04);
    }
  });

  return (
    <group>
      {/* Central Blue Glowing Wireframe Icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial
          color="#00d2ff"
          wireframe
          transparent
          opacity={0.4}
          emissive="#00557f"
          emissiveIntensity={1.8}
        />
      </mesh>
      {/* Golden Outer Particle Swarm */}
      <points ref={pointsRef}>
        <sphereGeometry args={[1.55, 20, 20]} />
        <pointsMaterial
          color="#d4af37"
          size={0.038}
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// ================= DYNAMIC BACKGROUND NETWORK LINES =================
function BackgroundNeuralNetwork() {
  const pointsRef = useRef();

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  // 150 floating neural points
  const points = useRef(
    new Float32Array(
      Array.from({ length: 150 * 3 }, () => (Math.random() - 0.5) * 12)
    )
  );

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#3b82f6"
        size={0.04}
        transparent
        opacity={0.35}
      />
    </points>
  );
}

// ================= ANIMATED VISUAL COUNTER COMPONENT =================
function ScrollCounter({ endValue, duration = 2000, suffix = "" }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const end = parseInt(endValue.replace(/[^0-9]/g, ""), 10);
          if (isNaN(end)) return;
          const stepTime = Math.abs(Math.floor(duration / end));
          const timer = setInterval(() => {
            start += Math.ceil(end / 40); // increment steps
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, Math.max(stepTime, 24));
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, [endValue, duration]);

  const formatted = count.toLocaleString();

  return (
    <span ref={elementRef} className="display-6 fw-bold text-white">
      {formatted}
      {suffix || (endValue.includes("+") ? "+" : endValue.includes("%") ? "%" : "")}
    </span>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const [activeStep, setActiveStep] = useState(0);

  // Horizontal Timeline Step Hover States
  const timelineSteps = [
    { title: "Problem", desc: "Submit scenario or upload document" },
    { title: "AI Analysis", desc: "Neural processing & translation" },
    { title: "Legal Intelligence", desc: "Extract laws & protections" },
    { title: "Expert Lawyer", desc: "Connect with matched verified counsels" },
    { title: "Justice", desc: "Secure resolution achieved" }
  ];

  return (
    <div style={{ background: '#02030a', minHeight: '100vh', color: '#fff', overflow: 'hidden' }}>
      
      {/* CSS Glassmorphic Animations Injection */}
      <style>{`
        .glass-hero-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          transition: all 0.35s ease;
        }
        .glass-hero-panel:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 210, 255, 0.3);
          box-shadow: 0 12px 30px rgba(0, 210, 255, 0.15);
        }
        .text-glow-gold {
          text-shadow: 0 0 16px rgba(214, 175, 55, 0.35);
        }
        .btn-premium-gold {
          background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
          color: #000 !important;
          font-weight: 700;
          box-shadow: 0 4px 18px rgba(212, 175, 55, 0.3);
          border: none;
          transition: all 0.3s;
        }
        .btn-premium-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.5);
        }
        .btn-premium-outline {
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.04);
          color: #fff !important;
          font-weight: 600;
          backdrop-filter: blur(10px);
          transition: all 0.3s;
        }
        .btn-premium-outline:hover {
          transform: translateY(-2px);
          border-color: #00d2ff;
          box-shadow: 0 4px 16px rgba(0, 210, 255, 0.25);
        }
        .timeline-step {
          padding: 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 0.3s;
          cursor: pointer;
        }
        .timeline-step.active {
          background: rgba(0, 210, 255, 0.08);
          border-color: #00d2ff;
          box-shadow: 0 0 12px rgba(0, 210, 255, 0.2);
        }
      `}</style>

      {/* ================= HERO SECTION ================= */}
      <section style={{ position: 'relative', padding: '140px 0 90px', background: 'radial-gradient(circle at 50% 0%, #0c122e 0%, #02030a 75%)' }}>
        
        {/* Dynamic 3D Neural Space Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <BackgroundNeuralNetwork />
          </Canvas>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="row align-items-center g-5">
            {/* Headline and Copy */}
            <div className="col-lg-6 text-start">
              <span className="badge px-3 py-2 mb-3 fw-bold rounded-pill" style={{
                background: 'rgba(0, 210, 255, 0.1)',
                color: '#00d2ff',
                border: '1px solid rgba(0, 210, 255, 0.2)',
                fontSize: '0.85rem',
                letterSpacing: '1px'
              }}>
                🤖 CITIZENLEX AI CORE ONLINE
              </span>
              <h1 className="display-4 fw-black text-start mb-4 text-glow-gold" style={{
                lineHeight: '1.18',
                letterSpacing: '-1.5px',
                fontWeight: 900
              }}>
                Justice, Powered by{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Artificial Intelligence
                </span>
              </h1>
              <p className="lead text-secondary mb-4 text-start" style={{ fontSize: '1.12rem', lineHeight: '1.7' }}>
                Analyze legal problems, discover trusted lawyers, and access intelligent legal guidance through one secure platform.
              </p>
              
              <div className="d-flex flex-wrap gap-3 mt-4">
                <Link to={user ? "/dashboard" : "/register"} className="btn btn-premium-gold px-4 py-3 d-flex align-items-center" style={{ borderRadius: '12px', fontSize: '0.95rem' }}>
                  <span>Start Your Legal Journey</span>
                  <i className="bi bi-arrow-right-short ms-2 fs-5"></i>
                </Link>
                <Link to="/lawyers" className="btn btn-premium-outline px-4 py-3 d-flex align-items-center" style={{ borderRadius: '12px', fontSize: '0.95rem' }}>
                  <i className="bi bi-search me-2 fs-6"></i>
                  <span>Find a Lawyer</span>
                </Link>
              </div>
            </div>

            {/* Interactive Holographic AI Orb Side */}
            <div className="col-lg-6 d-flex justify-content-center align-items-center" style={{ height: '360px' }}>
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Canvas camera={{ position: [0, 0, 3.8] }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[5, 5, 5]} intensity={1.8} />
                  <InteractiveAIOrb />
                </Canvas>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATS COUNTER GRID ================= */}
      <section className="py-5" style={{ background: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-3">
              <div className="p-3">
                <ScrollCounter endValue="12480+" suffix="+" />
                <div className="text-secondary small mt-1">Legal Queries Processed</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3">
                <ScrollCounter endValue="150+" suffix="+" />
                <div className="text-secondary small mt-1">Lawyers Available</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3">
                <ScrollCounter endValue="8920+" suffix="+" />
                <div className="text-secondary small mt-1">Documents Generated</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3">
                <ScrollCounter endValue="98%" suffix="%" />
                <div className="text-secondary small mt-1">AI Accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= DYNAMIC FEATURES SECTION ================= */}
      <section className="py-5 container">
        <h2 className="text-center mb-5 text-glow-gold fw-bold text-white">Platform Capabilities</h2>
        
        <div className="row g-4">
          <div className="col-md-4">
            <div className="glass-hero-panel p-4 h-100 text-start">
              <div className="rounded p-3 d-inline-block mb-3" style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff' }}>
                <i className="bi bi-chat-square-text-fill fs-4"></i>
              </div>
              <h4 className="fw-bold text-white">AI Assistant</h4>
              <p className="text-secondary">Simulates conversational legal intelligence. Ask questions and translate responses instantly between English and Tamil.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-hero-panel p-4 h-100 text-start">
              <div className="rounded p-3 d-inline-block mb-3" style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#d4af37' }}>
                <i className="bi bi-card-checklist fs-4"></i>
              </div>
              <h4 className="fw-bold text-white">Rights Explorer</h4>
              <p className="text-secondary">Understand civil protections. Directly query consumer, children, and labour laws in simplified terms.</p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="glass-hero-panel p-4 h-100 text-start">
              <div className="rounded p-3 d-inline-block mb-3" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <i className="bi bi-search-heart-fill fs-4"></i>
              </div>
              <h4 className="fw-bold text-white">Scheme Finder</h4>
              <p className="text-secondary">Explore Indian welfare schemes. Run automated eligibility checks, verify documents, and prepare applications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PROCESS TIMELINE ================= */}
      <section className="py-5" style={{ background: 'radial-gradient(circle, #080c1f 0%, #02030a 100%)' }}>
        <div className="container text-center">
          <h2 className="mb-5 text-glow-gold fw-bold text-white">Resolution Pipeline</h2>
          
          <div className="row g-3 justify-content-center">
            {timelineSteps.map((step, idx) => (
              <div
                key={idx}
                className="col-lg-2 col-md-4"
                onMouseEnter={() => setActiveStep(idx)}
              >
                <div className={`timeline-step h-100 d-flex flex-column justify-content-center ${activeStep === idx ? 'active' : ''}`}>
                  <div className="fw-bold small text-glow-gold" style={{ color: activeStep === idx ? '#00d2ff' : '#d4af37' }}>
                    {idx + 1}. {step.title}
                  </div>
                  <div className="text-secondary small mt-2" style={{ fontSize: '0.78rem' }}>
                    {step.desc}
                  </div>
                  {idx < 4 && (
                    <div className="d-none d-lg-block mt-3" style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
                      <i className="bi bi-arrow-right fs-5"></i>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PWA INSTALLATION BANNER ================= */}
      {isInstallable && (
        <section className="container py-4">
          <div className="glass-hero-panel p-4 d-flex flex-wrap align-items-center justify-content-between gap-3 text-start" 
               style={{ borderLeft: '4px solid #d4af37' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 text-white p-3 d-flex align-items-center justify-content-center" style={{
                width: 50, height: 50,
                background: 'linear-gradient(135deg, #00d2ff, #d4af37)',
                borderRadius: '12px'
              }}>
                <i className="bi bi-phone-vibrate-fill fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1 text-white">Install CitizenLex PWA</h5>
                <p className="text-secondary small mb-0">Offline assistance, fast startup speeds, and zero-latency legal aids.</p>
              </div>
            </div>
            <button className="btn btn-premium-gold px-4 py-2" onClick={installApp} style={{ fontSize: '0.88rem', borderRadius: '10px' }}>
              <i className="bi bi-download me-2"></i>Install App
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
