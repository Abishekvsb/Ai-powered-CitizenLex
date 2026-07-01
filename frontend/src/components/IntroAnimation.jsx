import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Preload the real rigged eagle model to avoid loading delays
useGLTF.preload('/bald_eagle.glb');

// ================= AAA CINEMATIC AUDIO SYNTHESIZER =================
class AAACinematicAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.ambienceNodes = null;
  }
  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }
  mute(state) {
    this.isMuted = state;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(state ? 0 : 0.45, this.ctx.currentTime);
    }
  }
  playAmbience() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Orchestral drone / Cinematic pad
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 3.0);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start();
      osc2.start();
      this.ambienceNodes = { osc1, osc2, gain };
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }
  stopAmbience() {
    if (this.ambienceNodes && this.ctx) {
      const { osc1, osc2, gain } = this.ambienceNodes;
      try {
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (err) {}
        }, 1800);
      } catch (e) {}
    }
  }
  playFlap() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Deep low-pitched wind thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(45, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.38, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }
  playScreech() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Frequency-modulated eagle call
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const mainGain = this.ctx.createGain();

      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(850, this.ctx.currentTime);
      carrier.frequency.exponentialRampToValueAtTime(1450, this.ctx.currentTime + 0.15);
      carrier.frequency.exponentialRampToValueAtTime(500, this.ctx.currentTime + 0.65);

      modulator.type = 'sawtooth';
      modulator.frequency.setValueAtTime(160, this.ctx.currentTime);
      modulator.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.65);

      modGain.gain.setValueAtTime(400, this.ctx.currentTime);

      mainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.05);
      mainGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(mainGain);
      mainGain.connect(this.masterGain);

      carrier.start();
      modulator.start();
      carrier.stop(this.ctx.currentTime + 0.9);
      modulator.stop(this.ctx.currentTime + 0.9);
    } catch (e) {}
  }
  playLanding() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Heavy orchestral impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.frequency.setValueAtTime(65, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.8);
      subGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 0.9);

      // Gold shine bell chimes (arpeggiated)
      const chimes = [293.66, 349.23, 440.00, 587.33, 698.46, 880.00]; // Dm pentatonic/royal glow
      chimes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.7);
      });
    } catch (e) {}
  }
  playWhoosh() {
    if (!this.ctx || this.isMuted) return;
    try {
      // High-speed wind glide sound
      const bufferSize = this.ctx.sampleRate * 2.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);
      filter.frequency.setValueAtTime(80, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 1.2);
      filter.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 2.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.38, this.ctx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
      noise.stop(this.ctx.currentTime + 2.8);
    } catch (e) {}
  }
}

// ================= PROFESSIONALLY RIGGED EAGLE COMPONENT =================
function RealRiggedEagle({ flightProgress, hasLanded, audioSynth }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF('/bald_eagle.glb');
  const { ref, actions, names } = useAnimations(animations, groupRef);

  const flapTrackerRef = useRef(0);

  // Set gold PBR texture properties on the model's meshes dynamically
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Apply luxurious gold material to the model to fit our CitizenLex theme
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#d4af37"),
            roughness: 0.15,
            metalness: 0.9,
            envMapIntensity: 2.5
          });
        }
      });
    }
  }, [scene]);

  // Handle animation transitions based on flight vs landed state
  useEffect(() => {
    if (actions && names.length > 0) {
      // Find default actions
      const flightActionName = names.find(n => n.toLowerCase().includes('fly') || n.toLowerCase().includes('flight') || n.toLowerCase().includes('flap') || n.toLowerCase().includes('run')) || names[0];
      const idleActionName = names.find(n => n.toLowerCase().includes('idle') || n.toLowerCase().includes('stand') || n.toLowerCase().includes('land') || n.toLowerCase().includes('pose')) || names[names.length - 1] || names[0];

      if (!hasLanded) {
        if (actions[flightActionName]) {
          actions[flightActionName].reset().fadeIn(0.5).play();
        }
      } else {
        if (actions[flightActionName]) {
          actions[flightActionName].fadeOut(0.6);
        }
        if (actions[idleActionName]) {
          actions[idleActionName].reset().fadeIn(0.6).play();
        }
      }
    }
  }, [actions, names, hasLanded]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const progress = flightProgress.current;

    // Orbit path calculation
    if (progress < 1.0) {
      const radius = 24 * (1 - progress);
      const angle = t * 2.8 + progress * Math.PI * 2.5;

      const startZ = -105;
      const endZ = 0;
      const curZ = startZ + (endZ - startZ) * progress;

      const startY = 16;
      const endY = 1.6;
      const curY = startY + (endY - startY) * Math.pow(progress, 1.8);

      groupRef.current.position.x = Math.sin(angle) * radius;
      groupRef.current.position.y = curY + Math.sin(t * 8) * 0.1 * (1 - progress); // dynamic hover wobble
      groupRef.current.position.z = curZ;

      // Rotate group toward flight direction
      const nextAngle = angle + 0.05;
      const nextX = Math.sin(nextAngle) * radius;
      const nextZ = startZ + (endZ - startZ) * (progress + 0.01);
      const dirX = nextX - groupRef.current.position.x;
      const dirZ = nextZ - groupRef.current.position.z;

      const heading = Math.atan2(dirX, dirZ);
      groupRef.current.rotation.y = heading + Math.PI;
      groupRef.current.rotation.z = Math.sin(t * 3.5) * 0.22 * (1 - progress); // flight rolls
      groupRef.current.rotation.x = -0.12 * (1 - progress); // forward tilt

      // Synchronize periodic thud audio sound on flight flaps
      if (progress < 0.95 && Math.sin(t * 12) > 0.9 && t - flapTrackerRef.current > 0.35) {
        flapTrackerRef.current = t;
        audioSynth.current.playFlap();
      }
    } else {
      // Landed stance facing the screen
      groupRef.current.position.set(0, 1.6, 0);
      groupRef.current.rotation.set(0.1, Math.PI, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[1.3, 1.3, 1.3]} />
    </group>
  );
}

// ================= VOLUMETRIC FOG & EMBER SYSTEMS =================
function VolumetricFog({ count = 80 }) {
  const pointsRef = useRef();

  const particles = useRef(
    new Float32Array(
      Array.from({ length: count * 3 }, () => {
        return (Math.random() - 0.5) * 60; // Spread wide across coordinates
      })
    )
  );

  useFrame((state) => {
    const geo = pointsRef.current.geometry;
    const positions = geo.attributes.position.array;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 2] += 0.06; // Drift forward slowly
      if (positions[i * 3 + 2] > 20) {
        positions[i * 3 + 2] = -60; // recycle back
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#2b3b6b"
        size={4.5}
        transparent
        opacity={0.16}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Embers({ count = 180 }) {
  const pointsRef = useRef();

  const particles = useRef(
    new Float32Array(
      Array.from({ length: count * 3 }, () => {
        return (Math.random() - 0.5) * 20; // localized center sparks
      })
    )
  );

  useFrame((state) => {
    const geo = pointsRef.current.geometry;
    const positions = geo.attributes.position.array;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.08; // float upward
      positions[i * 3] += Math.sin(state.clock.getElapsedTime() + i) * 0.015; // drift horizontal
      if (positions[i * 3 + 1] > 10) {
        positions[i * 3 + 1] = -5; // recycle below
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#d4af37"
        size={0.08}
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ================= CINEMATIC CAMERA SYSTEM =================
function CinematicCamera({ flightProgress, hasLanded }) {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const progress = flightProgress.current;

    if (progress < 0.98) {
      // Cinematic camera orbit path following the eagle
      const zoomDepth = 40 * (1 - progress) + 7.2;
      camera.position.x = Math.sin(t * 0.8) * 3.5 * (1 - progress);
      camera.position.y = 3.0 * (1 - progress) + 1.8;
      camera.position.z = zoomDepth;
      camera.lookAt(0, 1.8 * progress, 0);
    } else {
      // Landing camera shake and slow dolly out transition
      const shakeTime = (t * 40);
      const shakeDecay = Math.max(0, 1 - (progress - 0.98) * 20); // decays rapidly
      
      const shakeX = Math.sin(shakeTime) * 0.08 * shakeDecay;
      const shakeY = Math.cos(shakeTime * 1.5) * 0.08 * shakeDecay;

      camera.position.x = shakeX;
      camera.position.y = 1.6 + shakeY;
      camera.position.z = 5.2; // dolly close to logo
      camera.lookAt(0, 1.6, 0);
    }
  });

  return null;
}

// ================= COMPONENT ROOT DEFINITION =================
export default function IntroAnimation({ onComplete }) {
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [logoAssembled, setLogoAssembled] = useState(false);

  const audioSynth = useRef(new AAACinematicAudio());
  const flightProgress = useRef(0);
  const introContainerRef = useRef();
  const taglineRef = useRef();
  const logoTextRef = useRef();

  // Handle Skip Trigger
  const triggerSkip = () => {
    gsap.killTweensOf(flightProgress);
    audioSynth.current.stopAmbience();

    // Smooth transition fade-out to prevent white flash
    gsap.to(introContainerRef.current, {
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
      onComplete: () => {
        sessionStorage.setItem('citizenlex_intro_played', 'true');
        onComplete();
      }
    });
  };

  // Keyboard and Double Click Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') triggerSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize and run animation sequence
  const startSequence = () => {
    setHasStarted(true);
    audioSynth.current.init();
    audioSynth.current.playAmbience();
    audioSynth.current.playWhoosh();

    // 8-12 seconds duration (10s)
    gsap.to(flightProgress, {
      current: 1.0,
      duration: 7.5,
      ease: 'power1.inOut',
      onStart: () => {
        // Play eagle screech midway through flight
        setTimeout(() => {
          audioSynth.current.playScreech();
        }, 3000);
      },
      onComplete: () => {
        // Trigger landing impact
        audioSynth.current.playLanding();
        setLogoAssembled(true);

        // Logo letters text shimmer sweep and timeline assembly
        gsap.fromTo(logoTextRef.current.children, {
          opacity: 0,
          scale: 0.7,
          filter: 'blur(8px)'
        }, {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          stagger: 0.08,
          duration: 0.8,
          ease: 'back.out(1.7)'
        });

        // Tagline fade in
        gsap.to(taglineRef.current, {
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: 0.5,
          ease: 'power3.out'
        });

        // Auto skip/transition into application after displaying title card
        setTimeout(() => {
          triggerSkip();
        }, 2200);
      }
    });
  };

  // Handle Mute Button State
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    audioSynth.current.mute(nextState);
  };

  // Skip rendering if already played in this browser session
  if (sessionStorage.getItem('citizenlex_intro_played') === 'true') {
    onComplete();
    return null;
  }

  return (
    <div
      ref={introContainerRef}
      onDoubleClick={triggerSkip}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: '#04050f',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
      }}
    >
      {/* Starting Overlay CTA (Satisfies browser autoplay requirement) */}
      {!hasStarted && (
        <div style={{
          position: 'absolute',
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          background: 'rgba(4, 5, 15, 0.95)',
          width: '100%', height: '100%',
          justifyContent: 'center'
        }}>
          <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '1.2px' }}>CITIZEN<span style={{ color: '#d4af37' }}>LEX</span></h2>
          <button
            onClick={startSequence}
            className="btn btn-lg"
            style={{
              background: 'linear-gradient(135deg, #d4af37, #b8860b)',
              color: '#000',
              fontWeight: 800,
              border: 'none',
              padding: '12px 36px',
              borderRadius: '30px',
              boxShadow: '0 8px 24px rgba(212,175,55,0.4)',
              transition: 'transform 0.2s',
              letterSpacing: '0.5px'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            ENTER PLATFORM
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Click to begin cinematic experience</span>
        </div>
      )}

      {/* Control overlay */}
      {hasStarted && (
        <div style={{
          position: 'absolute',
          top: '24px', right: '24px',
          zIndex: 100001,
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={toggleMute}
            className="btn btn-sm btn-glass text-white border border-light-subtle d-flex align-items-center gap-1.5"
            style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
          >
            <i className={`bi ${isMuted ? 'bi-volume-mute-fill text-danger' : 'bi-volume-up-fill text-warning'}`}></i>
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            onClick={triggerSkip}
            className="btn btn-sm btn-glass text-white border border-light-subtle"
            style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
          >
            <span>Skip Intro</span>
            <i className="bi bi-skip-end-fill ms-1"></i>
          </button>
        </div>
      )}

      {/* 3D WebGL Canvas Layer */}
      {hasStarted && (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <Canvas shadows camera={{ fov: 45, near: 0.1, far: 300 }}>
            {/* Cinematic Lighting Setup */}
            <ambientLight intensity={0.15} />
            <directionalLight
              position={[10, 20, 10]}
              intensity={3.2}
              color="#ffffff"
              castShadow
            />
            {/* Landing Spotlight with intense beam */}
            <spotLight
              position={[0, 12, -3]}
              intensity={5}
              angle={0.5}
              penumbra={0.8}
              color="#d4af37"
              castShadow
            />
            {/* Strong Rim light behind eagle */}
            <pointLight position={[0, 3, -8]} intensity={8} color="#ffffff" />
            <pointLight position={[0, 1.6, 0]} intensity={logoAssembled ? 6 : 0.8} color="#d4af37" />

            {/* VOLUMETRIC ATMOSPHERE */}
            <VolumetricFog />
            <Embers />

            {/* RIGGED EAGLE */}
            <Suspense fallback={null}>
              <RealRiggedEagle
                flightProgress={flightProgress}
                hasLanded={logoAssembled}
                audioSynth={audioSynth}
              />
            </Suspense>

            {/* Cinematic Camera tracking */}
            <CinematicCamera flightProgress={flightProgress} hasLanded={logoAssembled} />

            {/* Platform Floor */}
            <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <shadowMaterial opacity={0.35} />
            </mesh>
          </Canvas>
        </div>
      )}

      {/* Logo Typography assemble overlay */}
      {logoAssembled && (
        <div style={{
          position: 'absolute',
          bottom: '22%',
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <h1
            ref={logoTextRef}
            style={{
              fontSize: '3.6rem',
              fontWeight: 900,
              letterSpacing: '5px',
              margin: 0,
              textTransform: 'uppercase',
              color: '#ffffff',
              display: 'flex',
              gap: '4px',
              textShadow: '0 0 24px rgba(212,175,55,0.4)',
              background: 'linear-gradient(135deg, #ffffff, #d4af37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {/* Splitting to letters for GSAP assembly stagger */}
            {['C','i','t','i','z','e','n','L','e','x'].map((c, i) => (
              <span key={i} style={{ display: 'inline-block' }}>{c}</span>
            ))}
          </h1>
          <p
            ref={taglineRef}
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              letterSpacing: '4px',
              color: 'rgba(255,255,255,0.7)',
              marginTop: '12px',
              textTransform: 'uppercase',
              opacity: 0,
              transform: 'translateY(15px)'
            }}
          >
            Justice Powered by Artificial Intelligence
          </p>
        </div>
      )}
    </div>
  );
}
