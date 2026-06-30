import React, { useEffect, useRef } from 'react';

/**
 * Cinematic Cosmic Background for CitizenLex (Phase 6.7 Overhaul).
 * Draws:
 * - Cosmic navy, purple, indigo background.
 * - Left side background: Lady Justice statue (blue-purple lighting).
 * - Right side background: Court pillars (purple-orange lighting).
 * - Floating particles, 3D elements, and subtle connecting lines.
 * - Stack of Books (LAW) bottom-left.
 * - Gavel bottom-right.
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

    let particles = [];
    let shapes = [];
    const mouse = { x: null, y: null, targetX: null, targetY: null, radius: 180 };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.targetX = null;
      mouse.targetY = null;
    };
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 1.5 + 0.6;
        this.opacity = Math.random() * 0.35 + 0.15;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx = -this.vx;
        if (this.y < 0 || this.y > height) this.vy = -this.vy;

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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${this.opacity})`;
        ctx.fill();
      }
    }

    class FloatingShape {
      constructor(type) {
        this.type = type;
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 100;
        this.size = Math.random() * 20 + 20;
        this.speed = Math.random() * 0.12 + 0.05;
        this.vx = (Math.random() - 0.5) * 0.1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.0025;
        this.opacity = Math.random() * 0.06 + 0.02;
        this.depth = Math.random() * 0.6 + 0.3;
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
        ctx.save();
        let renderX = this.x;
        let renderY = this.y;
        if (mouse.x !== null && mouse.y !== null) {
          const offsetX = (mouse.x - width / 2) * 0.015 * this.depth;
          const offsetY = (mouse.y - height / 2) * 0.015 * this.depth;
          renderX -= offsetX;
          renderY -= offsetY;
        }

        ctx.translate(renderX, renderY);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.lineWidth = 1;
        const s = this.size;

        // Draw simple floating geometries
        ctx.beginPath();
        for (let side = 0; side < 6; side++) {
          const angle = (side * Math.PI) / 3;
          ctx.lineTo(Math.cos(angle) * s * 0.4, Math.sin(angle) * s * 0.4);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      }
    }

    const initElements = () => {
      particles = [];
      shapes = [];
      const count = width < 768 ? 30 : 60;
      for (let i = 0; i < count; i++) {
        particles.push(new Particle(Math.random() * width, Math.random() * height));
      }
      for (let i = 0; i < 6; i++) {
        shapes.push(new FloatingShape('geom'));
      }
    };

    // Draw static assets (Books at bottom-left, Gavel at bottom-right)
    const drawBooksAndGavel = () => {
      ctx.save();
      ctx.lineWidth = 1.2;

      // 1. Books on Bottom-Left
      const bx = 80;
      const by = height - 120;
      // Draw 3 stacked books
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.fillStyle = 'rgba(12, 10, 36, 0.6)';
      
      // Bottom Book
      ctx.beginPath();
      ctx.roundRect(bx - 40, by + 40, 90, 20, 3);
      ctx.fill();
      ctx.stroke();
      
      // Middle Book
      ctx.beginPath();
      ctx.roundRect(bx - 35, by + 18, 85, 20, 3);
      ctx.fill();
      ctx.stroke();

      // Top Book
      ctx.beginPath();
      ctx.roundRect(bx - 30, by - 4, 75, 20, 3);
      ctx.fill();
      ctx.stroke();

      // Labeled Spine Text "LAW"
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 9px Outfit';
      ctx.fillText('LAW', bx - 10, by + 9);

      // 2. Gavel on Bottom-Right
      const gx = width - 120;
      const gy = height - 125;
      
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fillStyle = 'rgba(12, 10, 36, 0.6)';
      
      // Stand base
      ctx.beginPath();
      ctx.ellipse(gx, gy + 50, 35, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hammer Head (tilted)
      ctx.save();
      ctx.translate(gx, gy + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.beginPath();
      // Handle
      ctx.rect(-6, 10, 12, 45);
      // Head
      ctx.rect(-22, -10, 44, 20);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    };

    // Draw Lady Justice on the left
    const drawLadyJustice = () => {
      const jx = width * 0.22;
      const jy = height * 0.46;
      const s = height * 0.35;

      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.28)';
      ctx.lineWidth = 1.3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';

      // Pedestal base
      ctx.beginPath();
      ctx.rect(jx - 60, jy + s, 120, 15);
      ctx.rect(jx - 40, jy + s - 15, 80, 15);
      ctx.stroke();

      // Statue gown and body lines
      ctx.beginPath();
      // Head
      ctx.arc(jx, jy - 50, 16, 0, Math.PI * 2);
      // Blindfold band
      ctx.moveTo(jx - 16, jy - 50);
      ctx.lineTo(jx + 16, jy - 50);
      // Torso
      ctx.moveTo(jx - 10, jy - 34);
      ctx.lineTo(jx - 18, jy);
      ctx.lineTo(jx + 18, jy);
      ctx.lineTo(jx + 10, jy - 34);
      ctx.closePath();
      // Dress bottom
      ctx.moveTo(jx - 18, jy);
      ctx.lineTo(jx - 32, jy + s - 15);
      ctx.lineTo(jx + 32, jy + s - 15);
      ctx.lineTo(jx + 18, jy);
      ctx.stroke();

      // Left Arm holding Scales of Justice
      ctx.beginPath();
      ctx.moveTo(jx - 10, jy - 26);
      ctx.lineTo(jx - 50, jy - 15);
      ctx.stroke();

      const scaleX = jx - 50;
      const scaleY = jy - 15;
      ctx.beginPath();
      ctx.moveTo(scaleX - 35, scaleY);
      ctx.lineTo(scaleX + 35, scaleY); // Beam
      ctx.moveTo(scaleX, scaleY - 10);
      ctx.lineTo(scaleX, scaleY + 10); // Column base
      // Hang pans
      ctx.moveTo(scaleX - 35, scaleY);
      ctx.lineTo(scaleX - 45, scaleY + 30);
      ctx.moveTo(scaleX - 35, scaleY);
      ctx.lineTo(scaleX - 25, scaleY + 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(scaleX - 35, scaleY + 30, 10, 0, Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(scaleX + 35, scaleY);
      ctx.lineTo(scaleX + 25, scaleY + 30);
      ctx.moveTo(scaleX + 35, scaleY);
      ctx.lineTo(scaleX + 45, scaleY + 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(scaleX + 35, scaleY + 30, 10, 0, Math.PI);
      ctx.stroke();

      // Right Arm holding Sword
      ctx.beginPath();
      ctx.moveTo(jx + 10, jy - 26);
      ctx.lineTo(jx + 45, jy);
      ctx.lineTo(jx + 45, jy + 100); // Blade
      ctx.moveTo(jx + 36, jy + 15);
      ctx.lineTo(jx + 54, jy + 15); // Guard
      ctx.stroke();

      ctx.restore();
    };

    // Draw Court Pillars on the right
    const drawCourtPillars = () => {
      const px = width * 0.78;
      const py = height * 0.46;
      const s = height * 0.35;

      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.lineWidth = 1.3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';

      // Base Podium steps
      ctx.beginPath();
      ctx.rect(px - 100, py + s - 10, 200, 15);
      ctx.rect(px - 90, py + s - 25, 180, 15);
      ctx.stroke();

      // Triangle pediment roof
      ctx.beginPath();
      ctx.moveTo(px - 90, py - 60);
      ctx.lineTo(px + 90, py - 60);
      ctx.lineTo(px, py - 100);
      ctx.closePath();
      ctx.stroke();

      // Architrave block
      ctx.beginPath();
      ctx.rect(px - 85, py - 60, 170, 18);
      ctx.stroke();

      // 4 Pillars standing side-by-side
      const spacing = 42;
      const pillars = [px - 63, px - 21, px + 21, px + 63];
      pillars.forEach(x => {
        ctx.beginPath();
        // Capital
        ctx.rect(x - 12, py - 42, 24, 8);
        // Base
        ctx.rect(x - 12, py + s - 37, 24, 12);
        // Column shaft lines
        ctx.moveTo(x - 8, py - 34);
        ctx.lineTo(x - 8, py + s - 37);
        ctx.moveTo(x, py - 34);
        ctx.lineTo(x, py + s - 37);
        ctx.moveTo(x + 8, py - 34);
        ctx.lineTo(x + 8, py + s - 37);
        ctx.stroke();
      });

      ctx.restore();
    };

    const animate = (time) => {
      // Lerp mouse coordinates smoothly
      if (mouse.targetX !== null && mouse.targetY !== null) {
        if (mouse.x === null) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Cosmic Gradients background
      const skyGrad = ctx.createLinearGradient(0, 0, width, height);
      skyGrad.addColorStop(0, '#07061d'); // Deep navy
      skyGrad.addColorStop(0.5, '#0d0724'); // Purple cosmic
      skyGrad.addColorStop(1, '#02020a'); // Indigo black
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Left blue-purple glow mesh
      const leftGlow = ctx.createRadialGradient(width * 0.22, height * 0.5, 0, width * 0.22, height * 0.5, width * 0.4);
      leftGlow.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
      leftGlow.addColorStop(0.6, 'rgba(139, 92, 246, 0.04)');
      leftGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, width, height);

      // Right purple-orange glow mesh
      const rightGlow = ctx.createRadialGradient(width * 0.78, height * 0.5, 0, width * 0.78, height * 0.5, width * 0.4);
      rightGlow.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
      rightGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.03)');
      rightGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Scenic assets in linear perspective
      drawLadyJustice();
      drawCourtPillars();
      drawBooksAndGavel();

      // 3. Update & Draw floating particles
      for (let i = 0; i < shapes.length; i++) {
        shapes[i].update();
        shapes[i].draw();
      }

      // Draw particle nodes & connecting lines
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const lineColor = isDark ? 'rgba(168, 85, 247, ' : 'rgba(99, 102, 241, ';

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
            ctx.lineWidth = 0.5;
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
