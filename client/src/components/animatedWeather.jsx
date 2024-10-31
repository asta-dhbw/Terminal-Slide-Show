import React from 'react';
import { Wind, Droplets, ArrowUp } from 'lucide-react';
import '../styles/AnimatedWeather.css';

const AnimatedWeather = ({ weatherCode, temperature, windSpeed, windDirection }) => {
  return (
    <div className="weather-badge">
      <div className="flex flex-col items-center gap-3">
        <div>
          {getWeatherAnimation(weatherCode)}
        </div>
        <div className="temperature-container">
          <span className="text-4xl font-extrabold temperature-text">
            {Math.round(temperature)}°C
          </span>
        </div>
        <div className="weather-details">
          <div className="wind-info flex items-center gap-2">
            <Wind className="wind-icon" />
            <span className="wind-speed">
              {windSpeed} km/h
            </span>
            <ArrowUp 
              className="wind-direction-arrow" 
              style={{ 
                transform: `rotate(${windDirection}deg)`,
                transition: 'transform 0.5s ease'
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const getWeatherAnimation = (code) => {
  if (code <= 1) return <SunnyAnimation />;
  if (code <= 3) return <PartlyCloudyAnimation />;
  if (code <= 49) return <RainyAnimation />;
  if (code <= 69) return <SnowyAnimation />;
  if (code <= 79) return <ThunderstormAnimation />;
  if (code <= 99) return <CloudyAnimation />;
  return <SunnyAnimation />;
};

const SunnyAnimation = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <radialGradient id="sun-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: "#FFD700", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#FFA500", stopOpacity: 1 }} />
      </radialGradient>
    </defs>
    <circle 
      cx="50" 
      cy="50" 
      r="20" 
      fill="url(#sun-gradient)"
      className="sunny-circle"
    />
    {[...Array(8)].map((_, i) => (
      <line
        key={i}
        x1="50"
        y1="50"
        x2="50"
        y2="20"
        stroke="#FFD700"
        strokeWidth="4"
        className="sunny-ray"
        style={{
          transformOrigin: '50% 50%',
          transform: `rotate(${i * 45}deg)`,
        }}
      />
    ))}
    <style>{`
      .sunny-circle {
        animation: pulse 2s infinite;
        filter: drop-shadow(0 0 10px #FFD700);
      }
      .sunny-ray {
        animation: ray-pulse 2s infinite;
        filter: drop-shadow(0 0 5px #FFD700);
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes ray-pulse {
        0%, 100% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(45deg) scale(1.1); }
      }
    `}</style>
  </svg>
);

const CloudyAnimation = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="cloud-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#E0E0E0", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#B0B0B0", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path
      d="M25,60 A20,20 0 0,1 65,60 A20,20 0 0,1 45,80 L30,80 A15,15 0 0,1 25,60"
      fill="url(#cloud-gradient)"
      className="cloudy-cloud"
    />
    <style>{`
      .cloudy-cloud {
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 0 10px #B0B0B0);
      }
      @keyframes float {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(5px); }
      }
    `}</style>
  </svg>
);

const RainyAnimation = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <CloudyAnimation />
    {[...Array(5)].map((_, i) => (
      <line
        key={i}
        x1={30 + i * 10}
        y1="70"
        x2={25 + i * 10}
        y2="90"
        stroke="#4FC3F7"
        strokeWidth="2"
        className="rain-drop"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
    <style>{`
      .rain-drop {
        animation: rain 1.5s linear infinite;
        filter: drop-shadow(0 0 5px #4FC3F7);
      }
      @keyframes rain {
        0% { transform: translateY(-10px); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(10px); opacity: 0; }
      }
    `}</style>
  </svg>
);

const SnowyAnimation = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <CloudyAnimation />
    {[...Array(5)].map((_, i) => (
      <circle
        key={i}
        cx={30 + i * 10}
        cy="75"
        r="2"
        fill="white"
        className="snow-flake"
        style={{ animationDelay: `${i * 0.3}s` }}
      />
    ))}
    <style>{`
      .snow-flake {
        animation: snow 2s linear infinite;
        filter: drop-shadow(0 0 5px white);
      }
      @keyframes snow {
        0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(10px) rotate(360deg); opacity: 0; }
      }
    `}</style>
  </svg>
);

const ThunderstormAnimation = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="storm-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:"#4A4A4A", stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:"#1A1A1A", stopOpacity:1}} />
      </linearGradient>
    </defs>
    <CloudyAnimation />
    {[...Array(3)].map((_, i) => (
      <path
        key={i}
        d={`M${45 + i * 10},${65 + i * 5} L${55 + i * 10},${75 + i * 5} L${45 + i * 10},${85 + i * 5} L${55 + i * 10},${95 + i * 5}`}
        stroke="#FFD700"
        strokeWidth="3"
        fill="none"
        className={`lightning lightning-${i}`}
      />
    ))}
    <style>{`
      .lightning {
        animation: multi-lightning 2s infinite;
        filter: drop-shadow(0 0 10px #FFD700);
      }
      .lightning-0 { animation-delay: 0s; }
      .lightning-1 { animation-delay: 0.5s; }
      .lightning-2 { animation-delay: 1s; }
      @keyframes multi-lightning {
        0%, 90%, 100% { opacity: 0; }
        92%, 95% { opacity: 1; }
      }
    `}</style>
  </svg>
);

const PartlyCloudyAnimation = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <radialGradient id="partly-cloudy-sun-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style={{ stopColor: "#FFD700", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#FFA500", stopOpacity: 1 }} />
      </radialGradient>
      <linearGradient id="partly-cloudy-cloud-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#E0E0E0", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#B0B0B0", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <circle 
      cx="35" 
      cy="40" 
      r="15" 
      fill="url(#partly-cloudy-sun-gradient)"
      className="partly-cloudy-sun"
    />
    <path
      d="M45,50 A15,15 0 0,1 75,50 A15,15 0 0,1 60,65 L50,65 A15,15 0 0,1 45,50"
      fill="url(#partly-cloudy-cloud-gradient)"
      className="partly-cloudy-cloud"
    />
    <style>{`
      .partly-cloudy-sun {
        animation: sun-pulse 2s infinite;
        filter: drop-shadow(0 0 10px #FFD700);
      }
      .partly-cloudy-cloud {
        animation: cloud-float 3s ease-in-out infinite;
        filter: drop-shadow(0 0 10px #B0B0B0);
      }
      @keyframes sun-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes cloud-float {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(5px); }
      }
    `}</style>
  </svg>
);

export default AnimatedWeather;