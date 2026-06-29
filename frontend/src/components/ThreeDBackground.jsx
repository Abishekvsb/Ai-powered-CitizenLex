import React, { useEffect, useRef } from 'react';

/**
 * Cinematic Hyper-Realistic Interactive Background (Phase 6.7).
 * Detects if path is /login or /register to activate the Cinematic Left Split composition:
 * - A large detailed wireframe Lady Justice statue on the left half.
 * - Glowing Scale of Justice tilting with mouse moves.
 * - Glowing Court Pillars standing in linear perspective.
 * - Floating holographic glass UI panels displaying mock stats and AI badges.
 * - Slowly morphing rolling fog, ambient glowing particles, and flickering light beams.
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

    let isAuthScreen = window.location.pathname === '/login' || window.location.pathname === '/register';
    const isMobile = width < 992; // Split screen activates above 992px

    let maxParticles = isMobile ? 25 : 60;
    const connectionDist = isMobile ? 80 : 110;

    let particles = [];
    let shapes = [];
    let holograms = [];
    let fogOrbs = [];
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
      isAuthScreen = window.location.pathname === '/login' || window.location.pathname === '/register';
      initElements();
    };

    // Mobile orientation gyro parallax mapping
    const handleDeviceOrientation = (e) => {
      if (e.beta !== null && e.gamma !== null) {
        mouse.targetX = (width / 2) + (e.gamma * (width / 35));
        mouse.targetY = (height / 2) + ((e.beta - 45) * (height / 35));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    // Node particle class for background constellation mesh
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
        ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
        ctx.fill();
      }
    }

    // Holographic UI panel
    class HologramPanel {
      constructor(x, y, title, type) {
        this.x = x;
        this.y = y;
        this.title = title;
        this.type = type; // 'graph', 'verify', 'badge'
        this.speed = Math.random() * 0.12 + 0.05;
        this.floatRange = Math.random() * 30 + 15;
        this.baseY = y;
        this.angle = Math.random() * Math.PI * 2;
        this.width = 160;
        this.height = 80;
      }

      update() {
        this.angle += 0.005;
        this.y = this.baseY + Math.sin(this.angle) * this.floatRange;
      }

      draw() {
        ctx.save();
        // Depth parallax offset
        let renderX = this.x;
        let renderY = this.y;
        if (mouse.x !== null && mouse.y !== null) {
          const offsetX = (mouse.x - width / 2) * 0.025;
          const offsetY = (mouse.y - height / 2) * 0.025;
          renderX -= offsetX;
          renderY -= offsetY;
        }

        // Draw Frosted Card
        ctx.fillStyle = 'rgba(11, 15, 25, 0.45)';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.22)';
        ctx.lineWidth = 1;
        
        // Rounded Rect
        ctx.beginPath();
        ctx.roundRect(renderX, renderY, this.width, this.height, 12);
        ctx.fill();
        ctx.stroke();

        // Neon Glow accents
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(renderX + 16, renderY + 16, 3, 0, Math.PI * 2);
        ctx.fill();

        // Title text
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 9px Outfit';
        ctx.fillText(this.title, renderX + 26, renderY + 19);

        if (this.type === 'graph') {
          // Draw mock line chart
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(renderX + 16, renderY + 55);
          ctx.lineTo(renderX + 50, renderY + 42);
          ctx.lineTo(renderX + 85, renderY + 58);
          ctx.lineTo(renderX + 110, renderY + 38);
          ctx.lineTo(renderX + 144, renderY + 48);
          ctx.stroke();

          ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
          ctx.lineTo(renderX + 144, renderY + 65);
          ctx.lineTo(renderX + 16, renderY + 65);
          ctx.fill();
        } else if (this.type === 'verify') {
          // Draw check details
          ctx.fillStyle = '#10b981';
          ctx.font = '8px Outfit';
          ctx.fillText('✓ DECENTRALIZED DATA LOCK', renderX + 16, renderY + 42);
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(renderX + 16, renderY + 54, 128, 4);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(renderX + 16, renderY + 54, 95, 4);
        } else {
          // Draw shield outline
          ctx.strokeStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(renderX + 80, renderY + 35);
          ctx.lineTo(renderX + 92, renderY + 38);
          ctx.lineTo(renderX + 90, renderY + 50);
          ctx.quadraticCurveTo(renderX + 80, renderY + 62, renderX + 80, renderY + 62);
          ctx.quadraticCurveTo(renderX + 80, renderY + 62, renderX + 70, renderY + 50);
          ctx.lineTo(renderX + 68, renderY + 38);
          ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = 'rgba(245,158,11,0.1)';
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // Slowly drifting atmospheric fog particles
    class FogOrb {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * (width * 0.55);
        this.y = Math.random() * height;
        this.radius = Math.random() * 120 + 80;
        this.vx = (Math.random() - 0.5) * 0.15;
        this.vy = (Math.random() - 0.5) * 0.15;
        this.opacity = Math.random() * 0.04 + 0.015;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -150 || this.x > width * 0.6 || this.y < -150 || this.y > height + 150) {
          this.reset();
        }
      }
      draw() {
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        grad.addColorStop(0, `rgba(99, 102, 241, ${this.opacity})`);
        grad.addColorStop(0.5, `rgba(168, 85, 247, ${this.opacity * 0.4})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // General floating background assets
    class FloatingShape {
      constructor(type) {
        this.type = type;
        this.reset(true);
      }

      reset(init = false) {
        // Position on the left half if auth screen, else full screen
        const areaWidth = isAuthScreen && !isMobile ? width * 0.55 : width;
        this.x = Math.random() * areaWidth;
        this.y = init ? Math.random() * height : height + 120;
        this.size = Math.random() * 25 + 25;
        this.speed = Math.random() * 0.15 + 0.06;
        this.vx = (Math.random() - 0.5) * 0.12;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.002;
        this.opacity = Math.random() * 0.07 + 0.03;
        this.depth = Math.random() * 0.6 + 0.3;
      }

      update() {
        this.y -= this.speed * this.depth;
        this.x += this.vx * this.depth;
        this.rotation += this.rotationSpeed;

        const maxRight = isAuthScreen && !isMobile ? width * 0.6 : width + 100;
        if (this.y < -120 || this.x < -120 || this.x > maxRight) {
          this.reset(false);
        }
      }

      draw() {
        ctx.save();

        let renderX = this.x;
        let renderY = this.y;
        if (mouse.x !== null && mouse.y !== null) {
          const offsetX = (mouse.x - width / 2) * 0.02 * this.depth;
          const offsetY = (mouse.y - height / 2) * 0.02 * this.depth;
          renderX -= offsetX;
          renderY -= offsetY;
        }

        ctx.translate(renderX, renderY);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = `rgba(168, 85, 247, ${this.opacity})`;
        ctx.lineWidth = 1;
        const s = this.size;

        if (this.type === 'shield') {
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.4);
          ctx.lineTo(s * 0.28, -s * 0.4);
          ctx.quadraticCurveTo(s * 0.32, 0.02, 0, s * 0.5);
          ctx.quadraticCurveTo(-s * 0.32, 0.02, -s * 0.28, -s * 0.4);
          ctx.closePath();
          ctx.stroke();
        } else if (this.type === 'gavel') {
          ctx.beginPath();
          ctx.moveTo(-s * 0.15, -s * 0.15);
          ctx.lineTo(s * 0.25, s * 0.25);
          ctx.moveTo(s * 0.08, s * 0.35);
          ctx.lineTo(s * 0.35, s * 0.08);
          ctx.stroke();
        } else if (this.type === 'geometric') {
          ctx.beginPath();
          for (let side = 0; side <= 6; side++) {
            const angle = (side * Math.PI) / 3;
            ctx.lineTo(Math.cos(angle) * s * 0.3, Math.sin(angle) * s * 0.3);
          }
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    const initElements = () => {
      particles = [];
      shapes = [];
      holograms = [];
      fogOrbs = [];

      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(Math.random() * width, Math.random() * height));
      }

      const types = ['shield', 'gavel', 'geometric'];
      const shapeCount = isMobile ? 3 : 8;
      for (let i = 0; i < shapeCount; i++) {
        shapes.push(new FloatingShape(types[i % types.length]));
      }

      if (isAuthScreen && !isMobile) {
        // Holograms inside left visual column
        holograms.push(new HologramPanel(width * 0.08, height * 0.16, 'AI VERIFICATION ANALYZER', 'verify'));
        holograms.push(new HologramPanel(width * 0.34, height * 0.28, 'CITIZEN SECURITY SCORES', 'badge'));
        holograms.push(new HologramPanel(width * 0.06, height * 0.62, 'REALTIME LEGAL ACTIVITY', 'graph'));

        // Soft fog structures
        for (let i = 0; i < 6; i++) {
          fogOrbs.push(new FogOrb());
        }
      }
    };

    // Draw the majestic Lady Justice statue in wireframe detail
    const drawLadyJusticeStatue = () => {
      if (!isAuthScreen || isMobile) return;

      const statueX = width * 0.23; // Centered in the left half
      const baseHeight = height * 0.82;
      const statueH = height * 0.68;

      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.24)';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.3)';

      // 1. Detailed base pedestal steps
      ctx.beginPath();
      ctx.rect(statueX - 110, baseHeight, 220, 20);
      ctx.rect(statueX - 80, baseHeight - 30, 160, 30);
      ctx.rect(statueX - 50, baseHeight - 65, 100, 35);
      ctx.stroke();

      // 2. Linear Court Pillars in linear perspective (background grid)
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      const pillarPositions = [width * 0.05, width * 0.14, width * 0.32, width * 0.41];
      pillarPositions.forEach(px => {
        ctx.beginPath();
        // Base
        ctx.rect(px - 20, baseHeight - 20, 40, 20);
        // Shaft
        ctx.rect(px - 12, height * 0.1, 24, baseHeight - height * 0.1 - 20);
        // Capital roof lines
        ctx.moveTo(px - 25, height * 0.1);
        ctx.lineTo(px + 25, height * 0.1);
        ctx.lineTo(px, height * 0.05);
        ctx.closePath();
        ctx.stroke();
      });

      // 3. Lady Justice Figure Silhouette lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
      ctx.lineWidth = 1.6;

      const bodyTop = baseHeight - 65;
      const headY = bodyTop - statueH + 110;
      const chestY = headY + 50;
      const waistY = chestY + 70;

      ctx.beginPath();
      // Face / blindfold ring
      ctx.arc(statueX, headY, 24, 0, Math.PI * 2);
      // Blindfold line crossing face
      ctx.moveTo(statueX - 24, headY - 2);
      ctx.lineTo(statueX + 24, headY - 2);
      ctx.stroke();

      // Hair bun
      ctx.beginPath();
      ctx.arc(statueX, headY - 25, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Gown folds & torso grid
      ctx.beginPath();
      ctx.moveTo(statueX - 8, headY + 24); // neck
      ctx.lineTo(statueX - 16, chestY); // shoulder left
      ctx.lineTo(statueX + 16, chestY); // shoulder right
      ctx.lineTo(statueX + 8, headY + 24);
      ctx.closePath();
      ctx.stroke();

      // Dress contours down to pedestal
      ctx.beginPath();
      ctx.moveTo(statueX - 16, chestY);
      ctx.quadraticCurveTo(statueX - 22, waistY, statueX - 18, waistY);
      ctx.lineTo(statueX - 44, bodyTop);
      ctx.lineTo(statueX + 44, bodyTop);
      ctx.lineTo(statueX + 18, waistY);
      ctx.quadraticCurveTo(statueX + 22, waistY, statueX + 16, chestY);
      ctx.stroke();

      // Vertial draping folds
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.lineWidth = 1;
      for (let i = -30; i <= 30; i += 15) {
        ctx.beginPath();
        ctx.moveTo(statueX + (i * 0.4), waistY);
        ctx.lineTo(statueX + i, bodyTop);
        ctx.stroke();
      }

      // 4. Right Arm holding Gilded Sword
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(statueX + 16, chestY);
      ctx.lineTo(statueX + 65, chestY + 20); // forearm out
      // Sword blade pointing down
      const hiltX = statueX + 65;
      const hiltY = chestY + 20;
      ctx.moveTo(hiltX, hiltY - 12);
      ctx.lineTo(hiltX, hiltY + 12); // crossguard
      ctx.moveTo(hiltX, hiltY);
      ctx.lineTo(hiltX + 8, hiltY + 110); // blade edge
      ctx.stroke();

      // 5. Left Arm holding the animated tilting scales
      ctx.beginPath();
      ctx.moveTo(statueX - 16, chestY);
      ctx.lineTo(statueX - 60, chestY - 15); // arm raised slightly
      ctx.stroke();

      // Dynamic tilt calculations based on mouse coordinates
      let scaleTilt = 0;
      if (mouse.x !== null) {
        const dx = mouse.x - statueX;
        scaleTilt = Math.max(-0.25, Math.min(0.25, dx / width));
      }

      const balanceX = statueX - 60;
      const balanceY = chestY - 15;
      const beamL = 70;

      // Draw Scale Beam
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'; // Gold scales highlight
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Center balance point
      ctx.arc(balanceX, balanceY, 4, 0, Math.PI * 2);
      ctx.fill();
      // Beam tilted lines
      const leftTipX = balanceX - Math.cos(scaleTilt) * beamL;
      const leftTipY = balanceY - Math.sin(scaleTilt) * beamL;
      const rightTipX = balanceX + Math.cos(scaleTilt) * beamL;
      const rightTipY = balanceY + Math.sin(scaleTilt) * beamL;
      ctx.moveTo(leftTipX, leftTipY);
      ctx.lineTo(rightTipX, rightTipY);
      ctx.stroke();

      // Hang lines & pans
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
      // Left Pan
      ctx.beginPath();
      ctx.moveTo(leftTipX, leftTipY);
      ctx.lineTo(leftTipX - 14, leftTipY + 45);
      ctx.moveTo(leftTipX, leftTipY);
      ctx.lineTo(leftTipX + 14, leftTipY + 45);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(leftTipX, leftTipY + 45, 16, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Right Pan
      ctx.beginPath();
      ctx.moveTo(rightTipX, rightTipY);
      ctx.lineTo(rightTipX - 14, rightTipY + 45);
      ctx.moveTo(rightTipX, rightTipY);
      ctx.lineTo(rightTipX + 14, rightTipY + 45);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(rightTipX, rightTipY + 45, 16, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Light beam rays emanating from the Scale center
      const rayGrad = ctx.createRadialGradient(balanceX, balanceY, 0, balanceX, balanceY, 300);
      rayGrad.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
      rayGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
      rayGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.arc(balanceX, balanceY, 300, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const animate = (time) => {
      // Lerp mouse coordinate values for butter-smooth 60 FPS calculations
      if (mouse.targetX !== null && mouse.targetY !== null) {
        if (mouse.x === null) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.07;
          mouse.y += (mouse.targetY - mouse.y) * 0.07;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      ctx.clearRect(0, 0, width, height);

      frameCount++;
      const elapsed = time - lastTime;
      if (elapsed >= 1000) {
        fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = time;

        // Prevent frame drop lag
        if (fps < 35 && maxParticles > 15) {
          maxParticles = Math.max(15, Math.floor(maxParticles * 0.7));
          initElements();
        }
      }

      // 1. Draw atmospheric fog rolling in background
      for (let i = 0; i < fogOrbs.length; i++) {
        fogOrbs[i].update();
        fogOrbs[i].draw();
      }

      // 2. Draw pillars & Lady Justice statue
      drawLadyJusticeStatue();

      // 3. Draw floating wireframes
      for (let i = 0; i < shapes.length; i++) {
        shapes[i].update();
        shapes[i].draw();
      }

      // 4. Draw interactive node networks
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const lineColor = isDark ? 'rgba(139, 92, 246, ' : 'rgba(79, 70, 229, ';

      // Limit particle updates on the right side if auth screen (preserves card readability)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();

        if (isAuthScreen && !isMobile && p1.x > width * 0.58) {
          // Push particles back towards left side
          p1.x -= 2;
        }

        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = ((connectionDist - dist) / connectionDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `${lineColor}${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // 5. Draw floating Holographic cards on top
      for (let i = 0; i < holograms.length; i++) {
        holograms[i].update();
        holograms[i].draw();
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
