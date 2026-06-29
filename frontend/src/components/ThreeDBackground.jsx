import React, { useEffect, useRef } from 'react';

/**
 * High-performance Interactive SaaS Background.
 * Renders floating legal-themed icons (Gavel, Scales, Document, Shield)
 * along with connection constellations. Integrates mouse-guided parallax
 * offsets and dynamic theme styling. Fully responsive and frame-rate optimized.
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
    let maxParticles = isMobile ? 25 : 60;
    const connectionDist = isMobile ? 90 : 130;
    
    let particles = [];
    let shapes = [];
    const mouse = { x: null, y: null, radius: 150 };

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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // Particle Constellation Class
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 1.5 + 0.6;
        this.opacity = Math.random() * 0.4 + 0.15;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

        // Push away slightly from mouse cursor
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 1.2;
            this.y -= (dy / dist) * force * 1.2;
          }
        }
      }

      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(99, 102, 241, ${this.opacity})`
          : `rgba(59, 130, 246, ${this.opacity * 0.75})`;
        ctx.fill();
      }
    }

    // Floating Legal Object Shape Class
    class FloatingShape {
      constructor(type) {
        this.type = type; // 'gavel', 'scales', 'doc', 'shield'
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 100;
        this.size = Math.random() * 25 + 25; // 25px to 50px
        this.speed = Math.random() * 0.25 + 0.08; // slow drift
        this.vx = (Math.random() - 0.5) * 0.12;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.003;
        this.opacity = Math.random() * 0.07 + 0.03; // highly transparent, elegant watermark effect
        this.depth = Math.random() * 0.6 + 0.4; // parallax factor
      }

      update() {
        this.y -= this.speed * this.depth;
        this.x += this.vx * this.depth;
        this.rotation += this.rotationSpeed;

        if (this.y < -100 || this.x < -100 || this.x > width + 100) {
          this.reset(false);
        }
      }

      draw() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        ctx.save();

        // Parallax responsive offset
        let renderX = this.x;
        let renderY = this.y;
        if (mouse.x !== null && mouse.y !== null) {
          const offsetX = (mouse.x - width / 2) * 0.025 * this.depth;
          const offsetY = (mouse.y - height / 2) * 0.025 * this.depth;
          renderX -= offsetX;
          renderY -= offsetY;
        }

        ctx.translate(renderX, renderY);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = isDark
          ? `rgba(139, 92, 246, ${this.opacity})` // Purple
          : `rgba(37, 99, 235, ${this.opacity * 0.8})`;  // Blue
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw shape templates
        if (this.type === 'gavel') {
          // Handle
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.size * 0.4, this.size * 0.4);
          ctx.stroke();

          // Hammer head
          ctx.beginPath();
          ctx.moveTo(this.size * 0.3, this.size * 0.15);
          ctx.lineTo(this.size * 0.5, this.size * 0.35);
          ctx.lineWidth = 4;
          ctx.stroke();
        } else if (this.type === 'scales') {
          // Beam & Pillar
          ctx.beginPath();
          ctx.moveTo(0, -this.size * 0.35);
          ctx.lineTo(0, this.size * 0.35);
          ctx.moveTo(-this.size * 0.3, -this.size * 0.2);
          ctx.lineTo(this.size * 0.3, -this.size * 0.2);
          ctx.stroke();

          // Base
          ctx.beginPath();
          ctx.moveTo(-this.size * 0.2, this.size * 0.35);
          ctx.lineTo(this.size * 0.2, this.size * 0.35);
          ctx.stroke();

          // Scale pans
          ctx.beginPath();
          ctx.moveTo(-this.size * 0.3, -this.size * 0.2);
          ctx.lineTo(-this.size * 0.3, this.size * 0.1);
          ctx.moveTo(this.size * 0.3, -this.size * 0.2);
          ctx.lineTo(this.size * 0.3, this.size * 0.1);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(-this.size * 0.3, this.size * 0.1, this.size * 0.08, 0, Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(this.size * 0.3, this.size * 0.1, this.size * 0.08, 0, Math.PI);
          ctx.stroke();
        } else if (this.type === 'doc') {
          // Document layout border
          ctx.beginPath();
          ctx.rect(-this.size * 0.22, -this.size * 0.3, this.size * 0.44, this.size * 0.6);
          ctx.stroke();

          // Inside script indicators
          ctx.beginPath();
          ctx.moveTo(-this.size * 0.12, -this.size * 0.12);
          ctx.lineTo(this.size * 0.12, -this.size * 0.12);
          ctx.moveTo(-this.size * 0.12, 0);
          ctx.lineTo(this.size * 0.12, 0);
          ctx.moveTo(-this.size * 0.12, this.size * 0.12);
          ctx.lineTo(this.size * 0.03, this.size * 0.12);
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (this.type === 'shield') {
          // Shield outline path
          ctx.beginPath();
          ctx.moveTo(0, -this.size * 0.3);
          ctx.lineTo(this.size * 0.22, -this.size * 0.3);
          ctx.quadraticCurveTo(this.size * 0.25, 0.05, 0, this.size * 0.4);
          ctx.quadraticCurveTo(-this.size * 0.25, 0.05, -this.size * 0.22, -this.size * 0.3);
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    const initElements = () => {
      particles = [];
      shapes = [];
      const types = ['gavel', 'scales', 'doc', 'shield'];

      // Constellations
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(Math.random() * width, Math.random() * height));
      }

      // Legal background watermarks
      const shapeCount = isMobile ? 3 : 8;
      for (let i = 0; i < shapeCount; i++) {
        shapes.push(new FloatingShape(types[i % types.length]));
      }
    };

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const animate = (time) => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      
      // Premium visual styling: clear background to adapt to parent gradients
      ctx.clearRect(0, 0, width, height);

      // Performance adjustment based on system workload
      frameCount++;
      const elapsed = time - lastTime;
      if (elapsed >= 1000) {
        fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = time;
        if (fps < 30 && maxParticles > 15) {
          maxParticles = Math.max(15, Math.floor(maxParticles * 0.7));
          initElements();
        }
      }

      // 1. Render watermarks (lower layer)
      for (let i = 0; i < shapes.length; i++) {
        shapes[i].update();
        shapes[i].draw();
      }

      // 2. Render particle connections (constellations)
      const lineColor = isDark ? 'rgba(99, 102, 241, ' : 'rgba(59, 130, 246, ';

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
            const alpha = ((connectionDist - dist) / connectionDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${lineColor}${alpha})`;
            ctx.lineWidth = 0.65;
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
