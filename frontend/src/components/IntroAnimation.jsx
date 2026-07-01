import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import gsap from 'gsap';

// ================= PROCEDURAL AUDIO SYNTHESIZER =================
class IntroAudioSynth {
  constructor() {
    this.ctx = null;
    this.masterVolume = null;
    this.isMuted = false;
    this.ambienceNodes = null;
  }
  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.masterVolume.connect(this.ctx.destination);
  }
  mute(state) {
    this.isMuted = state;
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(state ? 0 : 0.4, this.ctx.currentTime);
    }
  }
  playAmbience() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low bass A1
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 3);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);

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
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (err) {}
        }, 1500);
      } catch (e) {}
    }
  }
  playFlap() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(55, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(12, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterVolume);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {}
  }
  playScreech() {
    if (!this.ctx || this.isMuted) return;
    try {
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const mainGain = this.ctx.createGain();

      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(800, this.ctx.currentTime);
      carrier.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);
      carrier.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.6);

      modulator.type = 'sawtooth';
      modulator.frequency.setValueAtTime(180, this.ctx.currentTime);
      modulator.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.6);

      modGain.gain.setValueAtTime(450, this.ctx.currentTime);

      mainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
      mainGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(mainGain);
      mainGain.connect(this.masterVolume);

      carrier.start();
      modulator.start();
      carrier.stop(this.ctx.currentTime + 0.8);
      modulator.stop(this.ctx.currentTime + 0.8);
    } catch (e) {}
  }
  playLanding() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Sub-bass hit
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(15, this.ctx.currentTime + 0.75);
      subGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      subOsc.connect(subGain);
      subGain.connect(this.masterVolume);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 0.85);

      // Gold orchestral chime
      const freqs = [293.66, 349.23, 440.00, 587.33, 698.46, 880.00]; // D minor/Gold chord
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime + idx * 0.04);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(this.masterVolume);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.7);
      });
    } catch (e) {}
  }
  playWhoosh() {
    if (!this.ctx || this.isMuted) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.5, this.ctx.currentTime);
      filter.frequency.setValueAtTime(80, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 1.0);
      filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 2.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterVolume);
      noise.start();
      noise.stop(this.ctx.currentTime + 2.5);
    } catch (e) {}
  }
}

// ================= PROCEDURAL 3D GOLDEN EAGLE =================
function GoldenEagle({ flightProgress, hasLanded, audioSynth }) {
  const groupRef = useRef();
  const leftWingRef = useRef();
  const leftWingOuterRef = useRef();
  const rightWingRef = useRef();
  const rightWingOuterRef = useRef();
  const tailRef = useRef();
  const headRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const bodyRef = useRef();

  const flapTrackerRef = useRef(0);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Procedural Flight Path Calculation
    const pathVal = flightProgress.current; // 0 (start) to 1 (landed)
    
    if (pathVal < 1.0) {
      // Eagle path: starts far back, flies forward, circles screen, lands on Y: 1.8
      const radius = 25 * (1 - pathVal);
      const angle = t * 2.8 + pathVal * Math.PI * 2.5;
      
      const startZ = -110;
      const endZ = 0;
      const curZ = startZ + (endZ - startZ) * pathVal;

      const startY = 15;
      const endY = 1.6;
      const curY = startY + (endY - startY) * Math.pow(pathVal, 1.8);

      groupRef.current.position.x = Math.sin(angle) * radius;
      groupRef.current.position.y = curY + Math.sin(t * 8) * 0.12 * (1 - pathVal); // flutter
      groupRef.current.position.z = curZ;

      // Rotate group toward flight direction
      const nextAngle = angle + 0.05;
      const nextX = Math.sin(nextAngle) * radius;
      const nextZ = startZ + (endZ - startZ) * (pathVal + 0.01);
      const dirX = nextX - groupRef.current.position.x;
      const dirZ = nextZ - groupRef.current.position.z;
      
      const heading = Math.atan2(dirX, dirZ);
      groupRef.current.rotation.y = heading + Math.PI;
      groupRef.current.rotation.z = Math.sin(t * 3.5) * 0.25 * (1 - pathVal); // body roll
      groupRef.current.rotation.x = -0.15 * (1 - pathVal); // tilt forward
    } else {
      // Landed state positioning
      groupRef.current.position.set(0, 1.6, 0);
      groupRef.current.rotation.set(0.12, Math.PI, 0); // slightly tilted up, looking front (facing negative Z)
    }

    // 2. Wing Flap Physics
    if (pathVal < 0.98) {
      const flapSpeed = 16 - pathVal * 8; // wings flap slower as gliding/landing
      const flapAngle = Math.sin(t * flapSpeed) * 0.45;
      
      // Left Wing segment rotations (sine offset for organic bone movement)
      leftWingRef.current.rotation.z = 0.45 + flapAngle;
      leftWingOuterRef.current.rotation.z = 0.3 + Math.sin(t * flapSpeed + 0.5) * 0.3;
      
      // Right Wing (symmetric inverse)
      rightWingRef.current.rotation.z = -0.45 - flapAngle;
      rightWingOuterRef.current.rotation.z = -0.3 - Math.sin(t * flapSpeed + 0.5) * 0.3;

      // Play audio wing flap synchronized at peak downstroke
      const isPeakDownstroke = flapAngle > 0.43;
      if (isPeakDownstroke && t - flapTrackerRef.current > 0.3) {
        flapTrackerRef.current = t;
        audioSynth.current.playFlap();
      }

      // Tail steering movement
      tailRef.current.rotation.y = Math.sin(t * 4) * 0.15;
      tailRef.current.rotation.x = Math.sin(t * 8) * 0.1;
    } else {
      // Wings slow folding animation
      const foldSpeed = 0.08;
      leftWingRef.current.rotation.z = gsap.utils.interpolate(leftWingRef.current.rotation.z, 1.35, foldSpeed);
      leftWingOuterRef.current.rotation.z = gsap.utils.interpolate(leftWingOuterRef.current.rotation.z, 0.95, foldSpeed);
      
      rightWingRef.current.rotation.z = gsap.utils.interpolate(rightWingRef.current.rotation.z, -1.35, foldSpeed);
      rightWingOuterRef.current.rotation.z = gsap.utils.interpolate(rightWingOuterRef.current.rotation.z, -0.95, foldSpeed);

      // Tail settles down
      tailRef.current.rotation.set(0.2, 0, 0);

      // Head looking left/right naturally
      const lookTime = t * 0.5;
      headRef.current.rotation.y = Math.sin(lookTime) * Math.cos(lookTime * 0.5) * 0.5;
      headRef.current.rotation.x = Math.sin(lookTime * 2) * 0.12;
    }

    // 3. Periodic Eye Blinking (scaling down Y axis of eye spheres)
    const isBlinking = Math.floor(t * 1.5) % 5 === 0 && (t % 1 < 0.12);
    if (isBlinking) {
      leftEyeRef.current.scale.y = 0.05;
      rightEyeRef.current.scale.y = 0.05;
    } else {
      leftEyeRef.current.scale.y = 1;
      rightEyeRef.current.scale.y = 1;
    }
  });

  // Premium Gold Legal-Tech PBR Material
  const goldMaterial = (
    <meshStandardMaterial
      color="#d4af37"
      roughness={0.15}
      metalness={0.9}
      envMapIntensity={2.5}
      bumpScale={0.05}
    />
  );

  const featherMaterial = (
    <meshStandardMaterial
      color="#b8860b"
      roughness={0.22}
      metalness={0.8}
      envMapIntensity={2.0}
    />
  );

  return (
    <group ref={groupRef}>
      {/* 3D Eagle Body */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <sphereGeometry args={[0.38, 32, 32]} />
        {goldMaterial}
      </mesh>

      {/* Tail Feathers */}
      <group ref={tailRef} position={[0, -0.15, -0.3]}>
        <mesh position={[0, 0, -0.35]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.25, 0.02, 0.45]} />
          {featherMaterial}
        </mesh>
        <mesh position={[-0.1, 0, -0.32]} rotation={[0.1, -0.18, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.4]} />
          {featherMaterial}
        </mesh>
        <mesh position={[0.1, 0, -0.32]} rotation={[0.1, 0.18, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.4]} />
          {featherMaterial}
        </mesh>
      </group>

      {/* Rigged Left Wing (Hierarchical bone nodes) */}
      <group ref={leftWingRef} position={[-0.22, 0.1, 0]}>
        <mesh position={[-0.45, 0, 0]}>
          <boxGeometry args={[0.9, 0.03, 0.35]} />
          {goldMaterial}
        </mesh>
        {/* Left Outer Wing Segment */}
        <group ref={leftWingOuterRef} position={[-0.9, 0, 0]}>
          <mesh position={[-0.4, 0, 0]}>
            <boxGeometry args={[0.8, 0.02, 0.3]} />
            {goldMaterial}
          </mesh>
          {/* Individual flight feathers */}
          {[0, 1, 2, 3, 4].map(idx => (
            <mesh
              key={idx}
              position={[-0.2 - idx * 0.12, -0.015, -0.2 - idx * 0.02]}
              rotation={[0, 0.2 + idx * 0.08, -0.12]}
            >
              <boxGeometry args={[0.18, 0.005, 0.45]} />
              {featherMaterial}
            </mesh>
          ))}
        </group>
      </group>

      {/* Rigged Right Wing */}
      <group ref={rightWingRef} position={[0.22, 0.1, 0]}>
        <mesh position={[0.45, 0, 0]}>
          <boxGeometry args={[0.9, 0.03, 0.35]} />
          {goldMaterial}
        </mesh>
        {/* Right Outer Wing Segment */}
        <group ref={rightWingOuterRef} position={[0.9, 0, 0]}>
          <mesh position={[0.4, 0, 0]}>
            <boxGeometry args={[0.8, 0.02, 0.3]} />
            {goldMaterial}
          </mesh>
          {/* Individual flight feathers */}
          {[0, 1, 2, 3, 4].map(idx => (
            <mesh
              key={idx}
              position={[0.2 + idx * 0.12, -0.015, -0.2 - idx * 0.02]}
              rotation={[0, -0.2 - idx * 0.08, 0.12]}
            >
              <boxGeometry args={[0.18, 0.005, 0.45]} />
              {featherMaterial}
            </mesh>
          ))}
        </group>
      </group>

      {/* Rigged Head, Beak, and Eyes */}
      <group ref={headRef} position={[0, 0.16, 0.28]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          {goldMaterial}
        </mesh>
        {/* Gold Beak */}
        <mesh position={[0, -0.04, 0.19]} rotation={[0.45, 0, 0]}>
          <coneGeometry args={[0.07, 0.18, 4]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Left Blinking Eye */}
        <mesh ref={leftEyeRef} position={[-0.09, 0.05, 0.09]}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Right Blinking Eye */}
        <mesh ref={rightEyeRef} position={[0.09, 0.05, 0.09]}>
          <sphereGeometry args={[0.032, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Segmented Talons */}
      <group position={[-0.1, -0.32, 0.05]}>
        <mesh rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.04, 0.1, 0.04]} />
          {goldMaterial}
        </mesh>
        <mesh position={[0, -0.05, 0.05]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.08]} />
          <meshStandardMaterial color="#000000" roughness={0.5} />
        </mesh>
      </group>
      <group position={[0.1, -0.32, 0.05]}>
        <mesh rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.04, 0.1, 0.04]} />
          {goldMaterial}
        </mesh>
        <mesh position={[0, -0.05, 0.05]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.08]} />
          <meshStandardMaterial color="#000000" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// ================= VOLUMETRIC EMBER & SMOKE PARTICLES =================
function SparkParticles({ count = 220, flightProgress }) {
  const pointsRef = useRef();

  const particles = useRef(
    new Float32Array(
      Array.from({ length: count * 3 }, (_, idx) => {
        if (idx % 3 === 0) return (Math.random() - 0.5) * 35; // X
        if (idx % 3 === 1) return (Math.random() - 0.5) * 20; // Y
        return (Math.random() - 0.8) * 80; // Z
      })
    )
  );

  const velocities = useRef(
    new Float32Array(
      Array.from({ length: count }, () => {
        return (Math.random() * 0.1 + 0.05); // Speed upwards
      })
    )
  );

  useFrame((state) => {
    const geo = pointsRef.current.geometry;
    const positions = geo.attributes.position.array;

    for (let i = 0; i < count; i++) {
      const idxY = i * 3 + 1;
      const idxZ = i * 3 + 2;

      // Spars drift up and closer to camera
      positions[idxY] += velocities.current[i];
      positions[idxZ] += 0.22;

      // Recycle particles when they move past camera view
      if (positions[idxZ] > 10 || positions[idxY] > 15) {
        positions[i * 3] = (Math.random() - 0.5) * 35;
        positions[idxY] = (Math.random() - 0.5) * 10 - 5;
        positions[idxZ] = (Math.random() - 0.8) * 80;
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
        color="#f59e0b"
        size={0.065}
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

// ================= DYNAMIC CAMERA DIRECTIVES =================
function CinematicCamera({ flightProgress, hasLanded }) {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const progress = flightProgress.current;

    if (progress < 0.98) {
      // Dynamic camera orbit path following the eagle
      const zoomDepth = 45 * (1 - progress) + 7.5;
      camera.position.x = Math.sin(t * 0.8) * 4 * (1 - progress);
      camera.position.y = 3.5 * (1 - progress) + 1.8;
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

  const audioSynth = useRef(new IntroAudioSynth());
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
      duration: 7.2,
      ease: 'power1.inOut',
      onStart: () => {
        // Play eagle screech midway through flight
        setTimeout(() => {
          audioSynth.current.playScreech();
        }, 2800);
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
          <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '1px' }}>GUIDE<span style={{ color: '#d4af37' }}>LEX</span></h2>
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
          <Canvas shadows>
            {/* Dark Cinematic Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight
              position={[10, 15, 10]}
              intensity={2.8}
              color="#ffffff"
              castShadow
            />
            <pointLight position={[0, 1.8, 0]} intensity={logoAssembled ? 5 : 0.5} color="#d4af37" />
            <spotLight
              position={[0, 10, -5]}
              intensity={4}
              angle={0.6}
              penumbra={1}
              color="#d4af37"
            />

            {/* Glowing Golden Eagle */}
            <GoldenEagle
              flightProgress={flightProgress}
              hasLanded={logoAssembled}
              audioSynth={audioSynth}
            />

            {/* Sparks and Volumetric Embers */}
            <SparkParticles flightProgress={flightProgress} />

            {/* Cinematic Camera */}
            <CinematicCamera flightProgress={flightProgress} hasLanded={logoAssembled} />

            {/* Logo Landing Platform */}
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
