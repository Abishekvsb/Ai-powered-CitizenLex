import React, { useEffect, useRef } from 'react';

/**
 * Cinematic High-End Interactive SaaS Background.
 * Renders floating 3D-like wireframe outlines of Lady Justice, Court Pillars,
 * Scales of Justice, Gavels, Shields, and abstract geometric shapes.
 * Combines particle constellations with mouse parallax and gyroscope support.
 */
export default function ThreeDBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;
    let maxParticles = isMobile ? 30 : 75;
    const connectionDist = isMobile ? 85 : 120;

    let particles = [];
    let shapes = [];
    const mouse = { x: null, y: null, radius: 160 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    };

    // Gyroscope tilt support for mobile
    const handleDeviceOrientation = (e) => {
      if (e.beta !== null && e.gamma !== null) {
        // Standardize gamma/beta values into a virtual screen coordinate
        mouse.x = (width / 2) + (e.gamma * (width / 40));
        mouse.y = (height / 2) + ((e.beta - 45) * (height / 40));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    // Light-weight 3D Constellation Particle
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.6 + 0.5;
        this.opacity = Math.random() * 0.35 + 0.15;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        // Interaction with mouse pointer
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 1.5;
            this.y -= (dy / dist) * force * 1.5;
          }
        }
      }

      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(99, 102, 241, ${this.opacity})`
          : `rgba(79, 70, 229, ${this.opacity * 0.8})`;
        ctx.fill();
      }
    }

    // 3D floating object drawing templates
    class FloatingShape {
      constructor(type) {
        this.type = type;
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 150;
        this.size = Math.random() * 30 + (this.type === 'justice' ? 50 : 30);
        this.speed = Math.random() * 0.22 + 0.08;
        this.vx = (Math.random() - 0.5) * 0.15;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.0025;
        this.opacity = Math.random() * 0.08 + 0.035; // watermark transparent levels
        this.depth = Math.random() * 0.7 + 0.3; // depth mapping for parallax effects
      }

      update() {
        this.y -= this.speed * this.depth;
        this.x += this.vx * this.depth;
        this.rotation += this.rotationSpeed;

        if (this.y < -150 || this.x < -150 || this.x > width + 150) {
          this.reset(false);
        }
      }

      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.save();

        let renderX = this.x;
        let renderY = this.y;
        if (mouse.x !== null && mouse.y !== null) {
          const offsetX = (mouse.x - width / 2) * 0.03 * this.depth;
          const offsetY = (mouse.y - height / 2) * 0.03 * this.depth;
          renderX -= offsetX;
          renderY -= offsetY;
        }

        ctx.translate(renderX, renderY);
        ctx.rotate(this.rotation);
        
        // Dynamic futuristic colors
        ctx.strokeStyle = isDark
          ? `rgba(168, 85, 247, ${this.opacity})` // Glowing neon purple
          : `rgba(79, 70, 229, ${this.opacity * 0.9})`; // Premium indigo
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const s = this.size;

        if (this.type === 'justice') {
          // Abstract Lady Justice wireframe
          ctx.beginPath();
          // Head / blindfold
          ctx.arc(0, -s * 0.5, s * 0.12, 0, Math.PI * 2);
          // Blindfold strap line
          ctx.moveTo(-s * 0.12, -s * 0.5);
          ctx.lineTo(s * 0.12, -s * 0.5);
          // Neck & body
          ctx.moveTo(0, -s * 0.38);
          ctx.lineTo(0, s * 0.3);
          // Gown silhouette details
          ctx.moveTo(0, -s * 0.2);
          ctx.lineTo(-s * 0.15, s * 0.3);
          ctx.moveTo(0, -s * 0.2);
          ctx.lineTo(s * 0.15, s * 0.3);
          // Left arm holding scales
          ctx.moveTo(0, -s * 0.25);
          ctx.lineTo(-s * 0.3, -s * 0.1);
          ctx.lineTo(-s * 0.45, -s * 0.1);
          // Left balance scale hang point
          ctx.moveTo(-s * 0.45, -s * 0.1);
          ctx.lineTo(-s * 0.55, s * 0.05);
          ctx.moveTo(-s * 0.45, -s * 0.1);
          ctx.lineTo(-s * 0.35, s * 0.05);
          ctx.arc(-s * 0.45, s * 0.05, s * 0.1, 0, Math.PI);
          // Right arm holding sword
          ctx.moveTo(0, -s * 0.25);
          ctx.lineTo(s * 0.25, -s * 0.1);
          // Sword blade down
          ctx.lineTo(s * 0.25, s * 0.4);
          ctx.moveTo(s * 0.18, 0);
          ctx.lineTo(s * 0.32, 0); // hilt guard
          ctx.stroke();
        } 
        else if (this.type === 'pillars') {
          // Abstract court room pillars
          ctx.beginPath();
          // Base podium
          ctx.rect(-s * 0.4, s * 0.25, s * 0.8, s * 0.1);
          // Arch roof triangular pediment
          ctx.moveTo(-s * 0.4, -s * 0.25);
          ctx.lineTo(s * 0.4, -s * 0.25);
          ctx.lineTo(0, -s * 0.5);
          ctx.closePath();
          // Three structural pillars
          ctx.rect(-s * 0.3, -s * 0.25, s * 0.12, s * 0.5);
          ctx.rect(-s * 0.06, -s * 0.25, s * 0.12, s * 0.5);
          ctx.rect(s * 0.18, -s * 0.25, s * 0.12, s * 0.5);
          ctx.stroke();
        } 
        else if (this.type === 'scales') {
          // Standard scale of justice
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.4);
          ctx.lineTo(0, s * 0.4);
          ctx.moveTo(-s * 0.3, -s * 0.2);
          ctx.lineTo(s * 0.3, -s * 0.2);
          // Left Pan
          ctx.moveTo(-s * 0.3, -s * 0.2);
          ctx.lineTo(-s * 0.4, s * 0.1);
          ctx.moveTo(-s * 0.3, -s * 0.2);
          ctx.lineTo(-s * 0.2, s * 0.1);
          ctx.moveTo(-s * 0.4, s * 0.1);
          ctx.lineTo(-s * 0.2, s * 0.1);
          // Right Pan
          ctx.moveTo(s * 0.3, -s * 0.2);
          ctx.lineTo(s * 0.2, s * 0.1);
          ctx.moveTo(s * 0.3, -s * 0.2);
          ctx.lineTo(s * 0.4, s * 0.1);
          ctx.moveTo(s * 0.2, s * 0.1);
          ctx.lineTo(s * 0.4, s * 0.1);
          // Solid base line
          ctx.moveTo(-s * 0.18, s * 0.4);
          ctx.lineTo(s * 0.18, s * 0.4);
          ctx.stroke();
        } 
        else if (this.type === 'shield') {
          // Technical shield outline
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.4);
          ctx.lineTo(s * 0.3, -s * 0.4);
          ctx.quadraticCurveTo(s * 0.35, 0.05, 0, s * 0.55);
          ctx.quadraticCurveTo(-s * 0.35, 0.05, -s * 0.3, -s * 0.4);
          ctx.closePath();
          // Inner detail wire line
          ctx.moveTo(0, -s * 0.3);
          ctx.lineTo(0, s * 0.4);
          ctx.stroke();
        } 
        else if (this.type === 'gavel') {
          // Floating courtroom gavel
          ctx.beginPath();
          ctx.moveTo(-s * 0.2, -s * 0.2);
          ctx.lineTo(s * 0.3, s * 0.3); // handle
          // Hammer head
          ctx.moveTo(s * 0.1, s * 0.4);
          ctx.lineTo(s * 0.4, s * 0.1);
          ctx.lineWidth = 4;
          ctx.stroke();
        } 
        else if (this.type === 'geometric') {
          // Futuristic neon wireframe rotating hexagon
          ctx.beginPath();
          for (let side = 0; side <= 6; side++) {
            const angle = (side * Math.PI) / 3;
            ctx.lineTo(Math.cos(angle) * s * 0.4, Math.sin(angle) * s * 0.4);
          }
          ctx.closePath();
          // Inner structural circle
          ctx.moveTo(s * 0.25, 0);
          ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    const initElements = () => {
      particles = [];
      shapes = [];
      const types = ['justice', 'pillars', 'scales', 'shield', 'gavel', 'geometric'];

      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(Math.random() * width, Math.random() * height));
      }

      const shapeCount = isMobile ? 4 : 10;
      for (let i = 0; i < shapeCount; i++) {
        shapes.push(new FloatingShape(types[i % types.length]));
      }
    };

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const animate = (time) => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      ctx.clearRect(0, 0, width, height);

      frameCount++;
      const elapsed = time - lastTime;
      if (elapsed >= 1000) {
        fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = time;
        // Adjust particle loads dynamically for frame drop prevention
        if (fps < 30 && maxParticles > 16) {
          maxParticles = Math.max(16, Math.floor(maxParticles * 0.7));
          initElements();
        }
      }

      // Draw floating wireframe objects first
      for (let i = 0; i < shapes.length; i++) {
        shapes[i].update();
        shapes[i].draw();
      }

      // Draw particle nodes and lines
      const lineColor = isDark ? 'rgba(139, 92, 246, ' : 'rgba(79, 70, 229, ';

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = ((connectionDist - dist) / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${lineColor}${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    initElements();
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
