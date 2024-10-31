import React from 'react';
import '../styles/AnimatedWeather.css';

const AnimatedWeather = ({ weatherCode, temperature }) => {
  return (
    <div className="weather-badge">
      <div className="flex flex-col items-center gap-2">
        <div className="weather-animation-wrapper w-24 h-24 relative">
          {getWeatherAnimation(weatherCode)}
        </div>
        <span className="text-lg font-bold">{Math.round(temperature)}°C</span>
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
    <circle 
      cx="50" 
      cy="50" 
      r="20" 
      fill="#FFD700"
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
      }
      .sunny-ray {
        animation: ray-pulse 2s infinite;
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
    <path
      d="M25,60 A20,20 0 0,1 65,60 A20,20 0 0,1 45,80 L30,80 A15,15 0 0,1 25,60"
      fill="#E0E0E0"
      className="cloudy-cloud"
    />
    <style>{`
      .cloudy-cloud {
        animation: float 3s ease-in-out infinite;
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
    <CloudyAnimation />
    <path
      d="M45,65 L55,75 L45,85 L55,95"
      stroke="#FFD700"
      strokeWidth="3"
      fill="none"
      className="lightning"
    />
    <style>{`
      .lightning {
        animation: lightning 2s infinite;
      }
      @keyframes lightning {
        0%, 95%, 100% { opacity: 0; }
        97% { opacity: 1; }
      }
    `}</style>
  </svg>
);

const PartlyCloudyAnimation = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle 
      cx="35" 
      cy="40" 
      r="15" 
      fill="#FFD700"
      className="partly-cloudy-sun"
    />
    <path
      d="M45,50 A15,15 0 0,1 75,50 A15,15 0 0,1 60,65 L50,65 A15,15 0 0,1 45,50"
      fill="#E0E0E0"
      className="partly-cloudy-cloud"
    />
    <style>{`
      .partly-cloudy-sun {
        animation: sun-pulse 2s infinite;
      }
      .partly-cloudy-cloud {
        animation: cloud-float 3s ease-in-out infinite;
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