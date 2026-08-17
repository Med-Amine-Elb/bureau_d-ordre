import { useEffect, useState } from "react";

export const PremiumGauge = ({ rate, count, total }: { rate: number; count: number; total: number }) => {
  const [animatedRate, setAnimatedRate] = useState(0);
  const [displayRate, setDisplayRate] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let startTime: number;
    let animationFrameId: number;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayRate(Math.round(easeProgress * rate));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      setAnimatedRate(rate);
      animationFrameId = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [rate]);

  const radius = 70;
  const strokeWidth = 14;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (animatedRate / 100) * circumference;

  return (
    <div
      className="relative flex flex-col items-center justify-end w-full h-[160px] mt-4 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        viewBox="0 0 200 110"
        className="w-full h-full drop-shadow-xl transition-transform duration-500 ease-out"
        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <path
          d={`M 30 100 A ${radius} ${radius} 0 0 1 170 100`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-slate-100 dark:text-slate-800"
        />

        {/* Animated Progress Track */}
        <path
          d={`M 30 100 A ${radius} ${radius} 0 0 1 170 100`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter={isHovered ? "url(#glow)" : "none"}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>

      <div className="absolute bottom-4 flex flex-col items-center pointer-events-none transition-transform duration-500" style={{ transform: isHovered ? 'translateY(-4px)' : 'translateY(0)' }}>
        <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-500 leading-none mb-1">
          {displayRate}%
        </span>
        <span className="text-[11px] text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full mt-1 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-700">
          {count} sur {total} terminés
        </span>
      </div>
    </div>
  );
};
