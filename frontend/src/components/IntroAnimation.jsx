import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Preload bald_eagle.glb to guarantee instant starts
useGLTF.preload('/bald_eagle.glb');

// ================= JARVIS-INSPIRED AI SYNTHESIZER =================
class JARVISAudioSynth {
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
    this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }
  mute(state) {
    this.isMuted = state;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(state ? 0 : 0.5, this.ctx.currentTime);
    }
  }
  playBoot() {
    if (!this.ctx || this.isMuted) return;
    try {
      // High-tech holographic start chirp
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.3);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, now);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.4);

      filter.type = 'bandpass';
      filter.Q.setValueAtTime(8, now);
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1500, now + 0.3);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {}
  }
  playAmbience() {
    if (!this.ctx || this.isMuted) return;
    try {
      // JARVIS system hum + atmospheric rise
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65.41, now); // C2 hum
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(130.81, now); // C3 chord tone

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 1.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      this.ambienceNodes = { osc1, osc2, gain };
    } catch (e) {}
  }
  playAIPulse() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Holographic HUD click
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }
  playFlap() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(42, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(8, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
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
      carrier.frequency.setValueAtTime(880, this.ctx.currentTime);
      carrier.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);
      carrier.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.6);

      modulator.type = 'sawtooth';
      modulator.frequency.setValueAtTime(170, this.ctx.currentTime);
      modulator.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + 0.6);

      modGain.gain.setValueAtTime(420, this.ctx.currentTime);

      mainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.16, this.ctx.currentTime + 0.05);
      mainGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(mainGain);
      mainGain.connect(this.masterGain);

      carrier.start();
      modulator.start();
      carrier.stop(this.ctx.currentTime + 0.85);
      modulator.stop(this.ctx.currentTime + 0.85);
    } catch (e) {}
  }
  playLanding() {
    if (!this.ctx || this.isMuted) return;
    try {
      // Sub impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(15, this.ctx.currentTime + 0.8);
      subGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start();
      subOsc.stop(this.ctx.currentTime + 0.9);

      // Gold shimmer bell chime arpeggio
      const chord = [293.66, 349.23, 440.00, 587.33, 698.46, 880.00];
      chord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.2);
      });
    } catch (e) {}
  }
  playWhoosh() {
    if (!this.ctx || this.isMuted) return;
    try {
      const bufferSize = this.ctx.sampleRate * 2.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.8, this.ctx.currentTime);
      filter.frequency.setValueAtTime(80, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(950, this.ctx.currentTime + 0.9);
      filter.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 2.0);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
      noise.stop(this.ctx.currentTime + 2.2);
    } catch (e) {}
  }
  stopAmbience() {
    if (this.ambienceNodes && this.ctx) {
      const { osc1, osc2, gain } = this.ambienceNodes;
      try {
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch (err) {}
        }, 1000);
      } catch (e) {}
    }
  }
}

// ================= AI CIRCUIT NETWORK BACKDROP =================
function AICircuitGrid({ active }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.04;
    }
  });

  if (!active) return null;

  return (
    <group ref={meshRef} position={[0, 0, -2]}>
      {[-3, -1.5, 0, 1.5, 3].map((pos, idx) => (
        <group key={idx}>
          {/* Vertical line */}
          <mesh position={[pos, 0, 0]}>
            <boxGeometry args={[0.015, 8, 0.015]} />
            <meshBasicMaterial color="#00d2ff" transparent opacity={0.3} />
          </mesh>
          {/* Horizontal line */}
          <mesh position={[0, pos, 0]}>
            <boxGeometry args={[8, 0.015, 0.015]} />
            <meshBasicMaterial color="#00d2ff" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Glow Nodes */}
      {[-3, -1.5, 0, 1.5, 3].map((x) =>
        [-3, -1.5, 0, 1.5, 3].map((y, idx) => (
          <mesh key={`${x}-${y}-${idx}`} position={[x, y, 0.02]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#d4af37" transparent opacity={0.55} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ================= FLOATING DIGITAL LEGAL DOCUMENTS =================
function FloatingDocuments({ active }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current && active) {
      const t = state.clock.getElapsedTime();
      groupRef.current.children.forEach((child, idx) => {
        child.rotation.y = Math.sin(t * 0.2 + idx) * 0.5;
        child.rotation.x = Math.cos(t * 0.15 + idx) * 0.3;
        child.position.y = Math.sin(t * 0.5 + idx) * 0.2 + (idx - 1) * 1.5;
      });
    }
  });

  if (!active) return null;

  const goldWireframe = new THREE.MeshBasicMaterial({
    color: "#d4af37",
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });

  return (
    <group ref={groupRef} position={[0, 0, -4]}>
      {/* 3 Floating documents in 3D */}
      <mesh position={[-2.8, 1.5, 0]}>
        <planeGeometry args={[0.9, 1.25]} />
        <primitive object={goldWireframe} />
      </mesh>
      <mesh position={[2.8, -1.2, 0.5]}>
        <planeGeometry args={[0.9, 1.25]} />
        <primitive object={goldWireframe} />
      </mesh>
      <mesh position={[-2.2, -1.8, -1.0]}>
        <planeGeometry args={[0.9, 1.25]} />
        <primitive object={goldWireframe} />
      </mesh>
    </group>
  );
}

// ================= COURT BUILDING SILHOUETTE =================
function CourthouseSilhouette({ visible }) {
  const groupRef = useRef();

  useEffect(() => {
    if (visible) {
      gsap.fromTo(groupRef.current.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'elastic.out(1, 0.75)' });
      gsap.fromTo(groupRef.current.position, { y: -2 }, { y: -0.6, duration: 1.0, ease: 'power2.out' });
    }
  }, [visible]);

  const archMat = new THREE.MeshStandardMaterial({
    color: "#d4af37",
    roughness: 0.1,
    metalness: 0.95
  });

  return (
    <group ref={groupRef} position={[0, -0.6, -3.2]} scale={[0, 0, 0]}>
      {/* Platform Pedestal */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[2.5, 0.08, 0.8]} />
        <primitive object={archMat} />
      </mesh>
      {/* Pillars */}
      {[-0.9, -0.45, -0.15, 0.15, 0.45, 0.9].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.95, 12]} />
          <primitive object={archMat} />
        </mesh>
      ))}
      {/* Architrave Pediment */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[2.5, 0.08, 0.8]} />
        <primitive object={archMat} />
      </mesh>
      <mesh position={[0, 0.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.4, 0.45, 4]} />
        <primitive object={archMat} />
      </mesh>
    </group>
  );
}

// ================= SHOCKWAVE =================
function ShockwaveRing({ active }) {
  const ringRef = useRef();

  useFrame(() => {
    if (ringRef.current && ringRef.current.scale.x < 30) {
      ringRef.current.scale.x += 0.4;
      ringRef.current.scale.y += 0.4;
      ringRef.current.material.opacity = Math.max(0, 1.0 - ringRef.current.scale.x / 30);
    }
  });

  if (!active) return null;

  return (
    <mesh ref={ringRef} position={[0, 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 1]}>
      <ringGeometry args={[0.05, 0.18, 64]} />
      <meshBasicMaterial color="#d4af37" transparent opacity={1.0} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ================= RIGGED EAGLE (LEFT FLIGHT PATH) =================
function LeftFlightEagle({ flightProgress, hasLanded, audioSynth }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF('/bald_eagle.glb');
  const { ref, actions, names } = useAnimations(animations, groupRef);

  const flapTrackerRef = useRef(0);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
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

  useEffect(() => {
    if (actions && names.length > 0) {
      const flightActionName = names.find(n => n.toLowerCase().includes('fly') || n.toLowerCase().includes('flight') || n.toLowerCase().includes('flap') || n.toLowerCase().includes('run')) || names[0];
      const idleActionName = names.find(n => n.toLowerCase().includes('idle') || n.toLowerCase().includes('stand') || n.toLowerCase().includes('land') || n.toLowerCase().includes('pose')) || names[names.length - 1] || names[0];

      if (!hasLanded) {
        if (actions[flightActionName]) {
          actions[flightActionName].reset().fadeIn(0.3).play();
        }
      } else {
        if (actions[flightActionName]) actions[flightActionName].fadeOut(0.5);
        if (actions[idleActionName]) actions[idleActionName].reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names, hasLanded]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const progress = flightProgress.current;

    if (progress < 1.0) {
      // Sweeps naturally from left side (X: -18 to 0)
      const startX = -18;
      const endX = 0;
      const curX = startX + (endX - startX) * progress;

      const startZ = -30;
      const endZ = 0;
      const curZ = startZ + (endZ - startZ) * progress;

      const startY = 6;
      const endY = 1.5;
      const curY = startY + (endY - startY) * Math.pow(progress, 1.5);

      groupRef.current.position.set(curX, curY + Math.sin(t * 8) * 0.08 * (1 - progress), curZ);

      // Rotate group toward flight path direction
      groupRef.current.rotation.y = Math.PI / 2 + (1 - progress) * (Math.PI / 4);
      groupRef.current.rotation.z = Math.sin(t * 3.5) * 0.15 * (1 - progress);
      groupRef.current.rotation.x = -0.1 * (1 - progress);

      if (Math.sin(t * 11) > 0.88 && t - flapTrackerRef.current > 0.35) {
        flapTrackerRef.current = t;
        audioSynth.current.playFlap();
      }
    } else {
      // Landed stance facing the screen
      groupRef.current.position.set(0, 1.5, 0);
      groupRef.current.rotation.set(0.1, Math.PI, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[1.2, 1.2, 1.2]} />
    </group>
  );
}

// ================= EMBERS & FOG PARTICLE SYSTEMS =================
function CloudsFog({ count = 60 }) {
  const pointsRef = useRef();

  const particles = useRef(
    new Float32Array(
      Array.from({ length: count * 3 }, () => {
        return (Math.random() - 0.5) * 50;
      })
    )
  );

  useFrame((state) => {
    const geo = pointsRef.current.geometry;
    const positions = geo.attributes.position.array;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 2] += 0.05; // drift forward
      if (positions[i * 3 + 2] > 15) {
        positions[i * 3 + 2] = -45;
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
        color="#1e2b58"
        size={3.8}
        transparent
        opacity={0.15}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Embers({ count = 120 }) {
  const pointsRef = useRef();

  const particles = useRef(
    new Float32Array(
      Array.from({ length: count * 3 }, () => {
        return (Math.random() - 0.5) * 16;
      })
    )
  );

  useFrame((state) => {
    const geo = pointsRef.current.geometry;
    const positions = geo.attributes.position.array;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.06; // float up
      if (positions[i * 3 + 1] > 8) {
        positions[i * 3 + 1] = -4;
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
        size={0.06}
        transparent
        opacity={0.55}
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
      // Dynamic dolly tracking from left
      const zoomZ = 30 * (1 - progress) + 6.8;
      camera.position.x = -3 * (1 - progress) + Math.sin(t * 0.5) * 0.15; // handheld wiggle
      camera.position.y = 2.0 * (1 - progress) + 1.6;
      camera.position.z = zoomZ;
      camera.lookAt(0, 1.5 * progress, 0);
    } else {
      // Rapid landing camera shake decay
      const shakeTime = t * 45;
      const shakeDecay = Math.max(0, 1 - (progress - 0.98) * 15);
      
      const shakeX = Math.sin(shakeTime) * 0.06 * shakeDecay;
      const shakeY = Math.cos(shakeTime * 1.5) * 0.06 * shakeDecay;

      camera.position.x = shakeX + Math.sin(t * 0.6) * 0.02; // subtle breathe
      camera.position.y = 1.5 + shakeY + Math.cos(t * 0.5) * 0.01;
      camera.position.z = 4.8; // close up focus on logo
      camera.lookAt(0, 1.5, 0);
    }
  });

  return null;
}

// ================= COMPONENT ROOT DEFINITION =================
export default function IntroAnimation({ onComplete }) {
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [logoAssembled, setLogoAssembled] = useState(false);

  // Storyboard phases: 'boot' | 'ai' | 'flight' | 'landing' | 'reveal' | 'transition'
  const [scenePhase, setScenePhase] = useState('boot');

  const audioSynth = useRef(new JARVISAudioSynth());
  const flightProgress = useRef(0);
  const introContainerRef = useRef();
  const taglineRef = useRef();
  const logoTextRef = useRef();

  // Skip Trigger Action
  const triggerSkip = () => {
    gsap.killTweensOf(flightProgress);
    audioSynth.current.stopAmbience();

    // Cinematic smooth transition zoom and fade out
    gsap.to(introContainerRef.current, {
      opacity: 0,
      scale: 1.05,
      duration: 0.85,
      ease: 'power2.inOut',
      onComplete: () => {
        sessionStorage.setItem('citizenlex_intro_played', 'true');
        onComplete();
      }
    });
  };

  // Skip keyboard and double click triggers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') triggerSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Run 7-8 seconds timeline sequence
  const startSequence = () => {
    setHasStarted(true);
    audioSynth.current.init();
    audioSynth.current.playBoot();
    audioSynth.current.playAmbience();

    // Scene 1 -> 2: AI Network Awakening (1.0s mark)
    setTimeout(() => {
      setScenePhase('ai');
      audioSynth.current.playAIPulse();
    }, 1000);

    // Scene 2 -> 3: Eagle Left Entrance (3.0s mark)
    setTimeout(() => {
      setScenePhase('flight');
      audioSynth.current.playWhoosh();

      // GSAP Flight Tracking (duration 2.2s -> lands at 5.2s mark)
      gsap.to(flightProgress, {
        current: 1.0,
        duration: 2.2,
        ease: 'power2.inOut',
        onStart: () => {
          setTimeout(() => {
            audioSynth.current.playScreech();
          }, 600);
        },
        onComplete: () => {
          // Scene 4: Landing & Courthouse silhouette (5.2s mark)
          setScenePhase('landing');
          audioSynth.current.playLanding();
          setLogoAssembled(true);

          // Scene 5: CitizenLex Logo Reveal (6.2s mark)
          setTimeout(() => {
            setScenePhase('reveal');

            // Logo letter assembly staggers
            gsap.fromTo(logoTextRef.current.children, {
              opacity: 0,
              scale: 0.65,
              filter: 'blur(10px)'
            }, {
              opacity: 1,
              scale: 1,
              filter: 'blur(0px)',
              stagger: 0.06,
              duration: 0.7,
              ease: 'back.out(1.8)'
            });

            // Tagline reveal
            gsap.to(taglineRef.current, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              delay: 0.4,
              ease: 'power3.out'
            });
          }, 400);

          // Scene 6: Zoom into Logo & Transition (7.4s mark)
          setTimeout(() => {
            setScenePhase('transition');
            triggerSkip();
          }, 2000);
        }
      });
    }, 3000);
  };

  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    audioSynth.current.mute(nextState);
  };

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
        background: '#02030a',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden'
      }}
    >
      {/* AUTOPLAY ACCESS OVERLAY */}
      {!hasStarted && (
        <div style={{
          position: 'absolute',
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          background: 'rgba(2, 3, 10, 0.98)',
          width: '100%', height: '100%',
          justifyContent: 'center'
        }}>
          <h2 style={{ color: '#fff', fontWeight: 800, letterSpacing: '1.5px' }}>CITIZEN<span style={{ color: '#d4af37' }}>LEX</span></h2>
          <button
            onClick={startSequence}
            className="btn btn-lg"
            style={{
              background: 'linear-gradient(135deg, #d4af37, #b8860b)',
              color: '#000',
              fontWeight: 800,
              border: 'none',
              padding: '12px 38px',
              borderRadius: '30px',
              boxShadow: '0 8px 24px rgba(212,175,55,0.4)',
              transition: 'transform 0.2s',
              letterSpacing: '0.5px'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            INITIALIZE PLATFORM
          </button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Click to begin cinematic experience</span>
        </div>
      )}

      {/* Control glass layer */}
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

      {/* SCENE 1: SYSTEM INITIALIZATION HUD OVERLAY */}
      {hasStarted && scenePhase === 'boot' && (
        <div style={{
          position: 'absolute',
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          textAlign: 'center'
        }}>
          {/* Glowing HUD Circle */}
          <div className="spinner-border text-info" style={{ width: '3rem', height: '3rem', borderWidth: '3px' }} role="status"></div>
          <p style={{
            color: '#00d2ff',
            fontSize: '0.9rem',
            fontWeight: 600,
            letterSpacing: '5px',
            textTransform: 'uppercase',
            margin: 0,
            animation: 'pulse 1s infinite'
          }}>
            Initializing CitizenLex...
          </p>
        </div>
      )}

      {/* 3D WebGL Canvas Layer */}
      {hasStarted && (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          <Canvas shadows camera={{ fov: 45, near: 0.1, far: 300 }}>
            {/* Cinematic Lighting Setup */}
            <ambientLight intensity={0.12} />
            <directionalLight
              position={[10, 20, 10]}
              intensity={3.0}
              color="#ffffff"
              castShadow
            />
            {/* Spotlight revealing courthouse podium */}
            <spotLight
              position={[0, 10, -2]}
              intensity={5}
              angle={0.6}
              penumbra={0.9}
              color="#d4af37"
              castShadow
            />
            <pointLight position={[0, 3, -6]} intensity={6} color="#00d2ff" />
            <pointLight position={[0, 1.5, 0]} intensity={logoAssembled ? 6 : 0.8} color="#d4af37" />

            {/* ATMOSPHERE */}
            <CloudsFog />
            <Embers />

            {/* AI HUD CIRCUIT BACKDROP */}
            <AICircuitGrid active={scenePhase !== 'boot'} />
            <FloatingDocuments active={scenePhase !== 'boot'} />

            {/* Courthouse Building (Scene 4) */}
            <CourthouseSilhouette visible={scenePhase === 'landing' || scenePhase === 'reveal'} />

            {/* Shockwave circle ring */}
            <ShockwaveRing active={scenePhase === 'landing' || scenePhase === 'reveal'} />

            {/* RIGGED EAGLE (Scene 3 & 4) */}
            {(scenePhase === 'flight' || scenePhase === 'landing' || scenePhase === 'reveal') && (
              <Suspense fallback={null}>
                <LeftFlightEagle
                  flightProgress={flightProgress}
                  hasLanded={logoAssembled}
                  audioSynth={audioSynth}
                />
              </Suspense>
            )}

            {/* Camera systems */}
            <CinematicCamera flightProgress={flightProgress} hasLanded={logoAssembled} />

            {/* Ground deck */}
            <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <shadowMaterial opacity={0.3} />
            </mesh>
          </Canvas>
        </div>
      )}

      {/* Logo Reveal Typography */}
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
