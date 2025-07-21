import React, { useState, useEffect, useRef } from "react";

const GalaxyPortal = () => {
  const [wish, setWish] = useState("");
  const [showWish, setShowWish] = useState(false);
  const [isTokenTossed, setIsTokenTossed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const energyRingsRef = useRef<EnergyRing[]>([]);
  const timeRef = useRef(0);

  class Star {
    x: number;
    y: number;
    brightness: number;
    twinkleSpeed: number;
    size: number;

    constructor(width: number, height: number) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.brightness = Math.random();
      this.twinkleSpeed = 0.02 + Math.random() * 0.03;
      this.size = Math.random() * 1.5 + 0.5;
    }

    update() {
      this.brightness += this.twinkleSpeed;
      if (this.brightness > 1 || this.brightness < 0) {
        this.twinkleSpeed *= -1;
      }
      this.brightness = Math.max(0, Math.min(1, this.brightness));
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = this.brightness * 0.8;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowBlur = this.size * 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  class EnergyRing {
    radius: number;
    maxRadius: number;
    alpha: number;
    rotationSpeed: number;
    rotation: number;
    thickness: number;

    constructor() {
      this.radius = 50 + Math.random() * 100;
      this.maxRadius = this.radius;
      this.alpha = 0.8;
      this.rotationSpeed = 0.02 + Math.random() * 0.03;
      this.rotation = Math.random() * Math.PI * 2;
      this.thickness = 2 + Math.random() * 3;
    }

    update(intensity: number) {
      this.rotation += this.rotationSpeed;
      this.radius = this.maxRadius + Math.sin(this.rotation * 3) * 20 * intensity;
    }

    draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, intensity: number) {
      ctx.strokeStyle = `rgba(0, 255, 255, ${this.alpha * intensity})`;
      ctx.lineWidth = this.thickness * intensity;
      ctx.shadowColor = "rgba(0, 255, 255, 0.5)";
      ctx.shadowBlur = 8 * intensity;
      
      ctx.beginPath();
      // Simplified ring drawing (fewer points)
      for (let i = 0; i <= 360; i += 15) {
        const angle = (i * Math.PI) / 180 + this.rotation;
        const waveOffset = Math.sin(angle * 4 + this.rotation * 3) * 8 * intensity;
        const x = centerX + (this.radius + waveOffset) * Math.cos(angle);
        const y = centerY + (this.radius + waveOffset) * Math.sin(angle);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  class Particle {
    x: number;
    y: number;
    baseRadius: number;
    radius: number;
    angle: number;
    speed: number;
    distance: number;
    spiralSpeed: number;
    alpha: number;
    alphaSpeed: number;
    brightnessPhase: number;
    hue: number;
    orbitOffset: number;
    trailPoints: Array<{x: number, y: number, alpha: number}>;

    constructor(centerX: number, centerY: number) {
      this.baseRadius = Math.random() * 3 + 0.8;
      this.radius = this.baseRadius;
      this.angle = Math.random() * 2 * Math.PI;
      this.speed = 0.01 + Math.random() * 0.02;
      this.distance = 300 + Math.random() * 400;
      this.spiralSpeed = 0.8 + Math.random() * 1.2;
      this.alpha = 0;
      this.alphaSpeed = 0.015 + Math.random() * 0.015;
      this.brightnessPhase = Math.random() * Math.PI * 2;
      this.hue = 180 + Math.random() * 60; // Cyan to blue range
      this.orbitOffset = Math.random() * Math.PI * 2;
      this.trailPoints = [];
      this.x = centerX + this.distance * Math.cos(this.angle);
      this.y = centerY + this.distance * Math.sin(this.angle);
    }

    update(centerX: number, centerY: number, time: number, blackHoleIntensity: number) {
      // Enhanced spiral motion with gravitational effect
      this.angle += this.speed * (1 + blackHoleIntensity * 0.5);
      
      // Accelerating spiral with distance-based gravity
      const gravityPull = Math.max(0, (500 - this.distance) / 500) * blackHoleIntensity;
      this.spiralSpeed = (0.8 + Math.random() * 1.2) * (1 + gravityPull * 3);
      this.distance -= this.spiralSpeed;
      
      if (this.distance < 15) {
        this.distance = 400 + Math.random() * 300;
        this.alpha = 0;
        this.angle = Math.random() * 2 * Math.PI;
      }

      // Orbital wobble for more organic motion
      const wobble = Math.sin(time * 0.02 + this.orbitOffset) * 20;
      this.x = centerX + (this.distance + wobble) * Math.cos(this.angle);
      this.y = centerY + (this.distance + wobble) * Math.sin(this.angle);

      // Enhanced alpha transitions
      if (this.alpha < 1 && this.distance < 350) {
        this.alpha += this.alphaSpeed;
      } else if (this.distance < 30) {
        this.alpha -= this.alphaSpeed * 3;
        if (this.alpha < 0) this.alpha = 0;
      }

      // Dynamic radius based on distance and intensity
      const distanceScale = Math.max(0.2, this.distance / 600);
      this.radius = this.baseRadius * distanceScale * (1 + blackHoleIntensity * 0.5);

      this.brightnessPhase += 0.08;

      // Update trail (reduced trail length)
      this.trailPoints.unshift({x: this.x, y: this.y, alpha: this.alpha});
      if (this.trailPoints.length > 4) {
        this.trailPoints.pop();
      }
    }

    draw(ctx: CanvasRenderingContext2D, blackHoleIntensity: number) {
      if (this.alpha <= 0) return;

      // Simplified trail rendering (skip some trail points)
      for (let i = 0; i < this.trailPoints.length; i += 1) {
        const point = this.trailPoints[i];
        const trailAlpha = point.alpha * (1 - i / this.trailPoints.length) * 0.4;
        if (trailAlpha > 0.02) {
          const trailSize = this.radius * (1 - i / this.trailPoints.length) * 0.6;
          ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${trailAlpha})`;
          ctx.shadowColor = `hsla(${this.hue}, 100%, 70%, ${trailAlpha * 0.5})`;
          ctx.shadowBlur = trailSize * 2;
          ctx.beginPath();
          ctx.arc(point.x, point.y, Math.max(trailSize, 0.1), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Simplified main particle rendering
      const glowIntensity = 0.7 + 0.3 * Math.sin(this.brightnessPhase);
      const finalAlpha = this.alpha * glowIntensity;
      const lightness = 60 + Math.sin(this.brightnessPhase) * 15;
      
      // Main particle with reduced shadow blur
      ctx.fillStyle = `hsla(${this.hue}, 100%, ${lightness}%, ${finalAlpha})`;
      ctx.shadowColor = `hsla(${this.hue}, 100%, 70%, ${finalAlpha * 0.8})`;
      ctx.shadowBlur = this.radius * (4 + blackHoleIntensity * 2);
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(this.radius, 0.3), 0, Math.PI * 2);
      ctx.fill();

      // Simplified core highlight
      ctx.fillStyle = `hsla(${this.hue + 30}, 100%, 90%, ${finalAlpha * 0.6})`;
      ctx.shadowBlur = this.radius * 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(this.radius * 0.3, 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize stars (reduced count)
    starsRef.current = [];
    for (let i = 0; i < 80; i++) {
      starsRef.current.push(new Star(width, height));
    }

    // Initialize particles (reduced count)
    particlesRef.current = [];
    for (let i = 0; i < 200; i++) {
      particlesRef.current.push(new Particle(centerX, centerY));
    }

    // Initialize energy rings (reduced count)
    energyRingsRef.current = [];
    for (let i = 0; i < 3; i++) {
      energyRingsRef.current.push(new EnergyRing());
    }

    let animationFrameId: number;

    const animate = () => {
      timeRef.current += 1;
      const time = timeRef.current;
      
      // Black hole intensity pulsing
      const baseIntensity = 0.8 + 0.2 * Math.sin(time * 0.03);
      const tokenIntensity = isTokenTossed ? 1.5 + Math.sin(time * 0.1) * 0.3 : 1;
      const blackHoleIntensity = baseIntensity * tokenIntensity;

      ctx.clearRect(0, 0, width, height);

      // Deep space background with gradient
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height));
      bgGradient.addColorStop(0, "#001122");
      bgGradient.addColorStop(0.5, "#000818");
      bgGradient.addColorStop(1, "#000005");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Animated starfield
      ctx.shadowBlur = 0;
      starsRef.current.forEach(star => {
        star.update();
        star.draw(ctx);
      });

      // Black hole event horizon with dynamic effects
      const eventHorizonSize = 25 + blackHoleIntensity * 15;
      const accretionDiskSize = 180 + blackHoleIntensity * 50;

      // Accretion disk glow
      const diskGradient = ctx.createRadialGradient(
        centerX, centerY, eventHorizonSize,
        centerX, centerY, accretionDiskSize
      );
      diskGradient.addColorStop(0, `rgba(255, 100, 0, ${0.8 * blackHoleIntensity})`);
      diskGradient.addColorStop(0.3, `rgba(0, 200, 255, ${0.4 * blackHoleIntensity})`);
      diskGradient.addColorStop(0.7, `rgba(100, 0, 255, ${0.2 * blackHoleIntensity})`);
      diskGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = diskGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, accretionDiskSize, 0, Math.PI * 2);
      ctx.fill();

      // Energy rings around black hole
      energyRingsRef.current.forEach(ring => {
        ring.update(blackHoleIntensity);
        ring.draw(ctx, centerX, centerY, blackHoleIntensity);
      });

      // Particle system
      ctx.shadowBlur = 0;
      particlesRef.current.forEach((particle) => {
        particle.update(centerX, centerY, time, blackHoleIntensity);
        particle.draw(ctx, blackHoleIntensity);
      });

      // Event horizon (black center)
      ctx.fillStyle = "black";
      ctx.shadowColor = `rgba(0, 255, 255, ${blackHoleIntensity})`;
      ctx.shadowBlur = eventHorizonSize;
      ctx.beginPath();
      ctx.arc(centerX, centerY, eventHorizonSize, 0, Math.PI * 2);
      ctx.fill();

      // Photon sphere effect
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * blackHoleIntensity})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, eventHorizonSize * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Reinitialize stars for new dimensions (reduced count)
      starsRef.current = [];
      for (let i = 0; i < 80; i++) {
        starsRef.current.push(new Star(width, height));
      }
    };

    

    return () => {
      cancelAnimationFrame(animationFrameId);
   
    };
  }, [isTokenTossed]);

  const handleToss = () => {
    if (!wish.trim()) {
      alert("Please enter your wish!");
      return;
    }
    setShowWish(false);
    setIsTokenTossed(true);
    
    setTimeout(() => {
      setShowWish(true);
    }, 1800);
    
    setTimeout(() => {
      setIsTokenTossed(false);
    }, 8000);
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-b from-black via-[#001017] to-[#000010] overflow-hidden flex flex-col items-center justify-center px-6 text-white select-none font-sans">
        
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center gap-8 p-6 bg-black bg-opacity-60 rounded-xl shadow-2xl border border-cyan-500 backdrop-blur-sm">
        <h1 className="text-6xl font-extrabold tracking-wide text-cyan-400 drop-shadow-[0_0_20px_cyan] text-center select-text">
          Cosmic Portal
        </h1>

        <input
          type="text"
          maxLength={80}
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder="Enter your cosmic wish..."
          className="w-full px-5 py-4 rounded-lg bg-black bg-opacity-70 border border-cyan-600 placeholder-cyan-400 text-cyan-200 text-xl font-semibold focus:outline-none focus:ring-4 focus:ring-cyan-600 focus:border-cyan-400 transition-all duration-300"
        />

        <button
          onClick={handleToss}
          disabled={isTokenTossed}
          className={`w-full py-4 rounded-full font-bold text-2xl tracking-wide transition-all duration-300 select-none ${
            isTokenTossed 
              ? "bg-purple-600 text-purple-200 cursor-not-allowed animate-pulse" 
              : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 drop-shadow-[0_0_15px_cyan]"
          }`}
          aria-label="Sacrifice Tokens to the Cosmic Portal"
        >
          {isTokenTossed ? "Tokens Consumed by the Void..." : "🪙 Sacrifice Tokens to the Void 🪙"}
        </button>

        {showWish && (
          <div className="mt-10 text-center text-4xl font-extrabold text-cyan-300 animate-cosmic-glow">
            ✨ {wish} ✨
          </div>
        )}
      </div>

      <style>{`
        @keyframes cosmic-glow {
          0%, 100% { 
            text-shadow: 
              0 0 10px #00ffff, 
              0 0 20px #00ffff, 
              0 0 30px #00ffff,
              0 0 40px #0080ff;
            opacity: 1; 
            transform: scale(1);
          }
          25% { 
            text-shadow: 
              0 0 15px #ff00ff, 
              0 0 25px #ff00ff, 
              0 0 35px #ff00ff,
              0 0 45px #8000ff;
            opacity: 0.9; 
            transform: scale(1.05);
          }
          50% { 
            text-shadow: 
              0 0 20px #00ff80, 
              0 0 30px #00ff80, 
              0 0 40px #00ff80,
              0 0 50px #00ff40;
            opacity: 0.95; 
            transform: scale(1.02);
          }
          75% { 
            text-shadow: 
              0 0 15px #ffff00, 
              0 0 25px #ffff00, 
              0 0 35px #ffff00,
              0 0 45px #ff8000;
            opacity: 0.9; 
            transform: scale(1.05);
          }
        }
        .animate-cosmic-glow {
          animation: cosmic-glow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default GalaxyPortal;