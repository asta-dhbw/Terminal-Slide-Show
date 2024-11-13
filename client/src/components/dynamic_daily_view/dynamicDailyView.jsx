/**
 * @component DynamicDailyView
 * @description A dynamic dashboard component that displays time, weather, quotes, NASA imagery and facts
 * Updates content periodically and handles day/night transitions
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Quote, Coffee, MapPin, Clock, Info } from 'lucide-react';
import '../../styles/dynamicDailyView.css';
import AnimatedWeather from './animatedWeather';
import { frontendConfig } from '../../../../config/frontend.config.js';

const DynamicDailyView = () => {
  const [time, setTime] = useState(new Date());
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fact, setFact] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [weather, setWeather] = useState(null);
  const [nasaImage, setNasaImage] = useState(null);
  const [showNasaInfo, setShowNasaInfo] = useState(false);
  const [greetings, setGreetings] = useState({});

  const isNight = time.getHours() >= 18 || time.getHours() < 6;

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      const quote = await response.json();
      setQuote(quote);
      setError(null);
    } catch (err) {
      setError('Failed to load quote');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacts = async () => {
    try {
      const response = await fetch('/api/facts');
      const fact = await response.json();
      setFact(fact);
    } catch (err) {
      console.error('Failed to fetch facts:', err);
    }
  };

  const fetchGreetings = async () => {
    try {
      const response = await fetch('/api/greetings');
      const greetings = await response.json();
      setGreetings(greetings);
    } catch (err) {
      console.error('Failed to fetch greetings:', err);
    }
  };

  /**
   * Returns appropriate greeting based on current hour
   * @param {number} hour - Current hour (0-23)
   * @returns {string} Corresponding greeting message
   */
  const getGreetings = (hour) => {
    for (const range in greetings) {
      const [start, end] = range.split('-').map(Number);
      if (hour >= start && hour < end) {
        return greetings[range];
      }
    }
    return 'Nachtschicht oder Feierabend? 🌙';
  };

  const fetchNasaImage = async () => {
    try {
      const response = await fetch('/api/nasa-apod');
      const data = await response.json();
      setNasaImage(data);
    } catch (err) {
      console.error('Failed to fetch NASA image:', err);
    }
  };

  const fetchWeather = async () => {
    try {
      const response = await fetch(`/api/weather?location=${encodeURIComponent(frontendConfig.info.location)}`);
      const data = await response.json();
      setWeather(data.current_weather);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Failed to load weather data');
    }
  };

  // Combine all timers in a single useEffect
  useEffect(() => {
    // Timer for time updates
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Timer for content updates
    const contentTimer = setInterval(() => {
      fetchQuotes();
      fetchWeather();
      fetchFacts();
    }, 300000);

    // NASA info auto-toggle timer
    const nasaInfoTimer = setInterval(() => {
      setShowNasaInfo(prev => !prev); // Toggle between open and closed
    }, 60000); // Toggles every 30 seconds

    // Initial fetches
    fetchQuotes();
    fetchWeather();
    fetchFacts();
    fetchNasaImage();
    fetchGreetings();

    // Cleanup all timers
    return () => {
      clearInterval(timer);
      clearInterval(contentTimer);
      clearInterval(nasaInfoTimer);
    };
  }, []);


  const formattedDate = time.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = time.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className={`daily-view ${isNight ? 'night' : 'day'}`}>
      {nasaImage && (
        <>
          <div
            className={`nasa-background ${isNight ? 'night' : 'day'}`}
            style={{ backgroundImage: `url(${nasaImage.url})` }}
          />
          <div className={`background-overlay ${isNight ? 'night' : 'day'}`} />
        </>
      )}

      <div className="background-effects">
        <div className="shooting-star"></div>
        <div className="shooting-star delay-1"></div>
        <div className="shooting-star delay-2"></div>
      </div>

      <div className="content-wrapper">
        <div className="dhbw-logo">
          <img src="/slideshow.png" alt="DHBW Logo" />
        </div>

        <div className="location-badge">
          <MapPin className="text-blue-300" />
          <span>{frontendConfig.info.location}</span>
        </div>

        <div className="main-content">
          <h1 className="greeting-text">{getGreetings(time.getHours())}</h1>

          <div className="datetime-display">
            <div className="date">
              <Calendar className="text-blue-300 select-none" />
              <span className="select-text">{formattedDate}</span>
            </div>
            <div className="time">
              <Clock className="text-blue-300 select-none" />
              <span className="select-text">{formattedTime}</span>
            </div>
          </div>

          <div className="quote-card" onClick={() => setShowTranslation(!showTranslation)}>
            <Quote className="text-yellow-300" />
            {isLoading ? (
              <p className="quote-text">Lädt Zitat...</p>
            ) : error ? (
              <p className="quote-text text-red-300">{error}</p>
            ) : quote ? (
              <>
                <p className="quote-text">{quote.text}</p>
                <p className="quote-author">- {quote.author}</p>
                {showTranslation && quote.translation && (
                  <p className="quote-translation">{quote.translation}</p>
                )}
              </>
            ) : null}
          </div>

          <div className="fact-card">
            <Coffee className="text-emerald-300" />
            <p>{fact}</p>
          </div>
        </div>

        <div>
          {weather && (
            <AnimatedWeather
              weatherCode={weather.weathercode}
              temperature={weather.temperature}
              windSpeed={weather.windspeed}
            />
          )}
        </div>

        {nasaImage && (
          <div
            className={`nasa-info ${showNasaInfo ? 'expanded' : ''}`}
            onClick={() => setShowNasaInfo(!showNasaInfo)}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="nasa-title">{nasaImage.title}</h3>
              <Info className="w-5 h-5 text-blue-300" />
            </div>
            <p className={`nasa-description ${showNasaInfo ? 'expanded' : ''}`}>
              {nasaImage.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicDailyView;