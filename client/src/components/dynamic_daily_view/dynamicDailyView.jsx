import React, { useState, useEffect } from 'react';
import { Calendar, Quote, Coffee, MapPin, Clock, Info } from 'lucide-react';
import '../../styles/dynamicDailyView.css';
import AnimatedWeather from './animatedWeather';
import { frontendConfig } from '../../../../config/frontend.config.js';
import { useServerStatus } from '../../hooks/useServerStatus';

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
  const isServerConnected = useServerStatus();

  const isNight = time.getHours() >= 18 || time.getHours() < 6;

  const loadFromCache = (key) => {
    try {
      const cached = localStorage.getItem(`dynamicView_${key}`);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 30 minutes
      if (Date.now() - timestamp > 30 * 60 * 1000) {
        localStorage.removeItem(`dynamicView_${key}`);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Failed to load from cache:', err);
      return null;
    }
  };

  const saveToCache = (key, data) => {
    try {
      localStorage.setItem(`dynamicView_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Failed to save to cache:', err);
    }
  };

  const fetchWithCache = async (endpoint, cacheKey, setter) => {
    try {
      if (!isServerConnected) {
        const cachedData = loadFromCache(cacheKey);
        if (cachedData) {
          setter(cachedData);
          setError(null);
          return;
        }
        throw new Error('No connection and no cached data available');
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      setter(data);
      saveToCache(cacheKey, data);
      setError(null);
    } catch (err) {
      console.error(`Failed to fetch ${cacheKey}:`, err);
      // Try to load from cache even if the error wasn't connection-related
      const cachedData = loadFromCache(cacheKey);
      if (cachedData) {
        setter(cachedData);
        setError(`Using cached ${cacheKey} data`);
      } else {
        setError(`Failed to load ${cacheKey}`);
      }
    } finally {
      if (cacheKey === 'quotes') setIsLoading(false);
    }
  };

  const fetchQuotes = () => fetchWithCache('/api/quotes', 'quotes', setQuote);
  const fetchFacts = () => fetchWithCache('/api/facts', 'facts', setFact);
  const fetchGreetings = () => fetchWithCache('/api/greetings', 'greetings', setGreetings);
  const fetchNasaImage = () => fetchWithCache('/api/nasa-apod', 'nasa', setNasaImage);

  const fetchWeather = () => {
    fetchWithCache(
      `/api/weather?location=${encodeURIComponent(frontendConfig.info.location)}`,
      'weather',
      (data) => setWeather(data.current_weather)
    );
  };

  const getGreetings = (hour) => {
    for (const range in greetings) {
      const [start, end] = range.split('-').map(Number);
      if (hour >= start && hour < end) {
        return greetings[range];
      }
    }
    return 'Nachtschicht oder Feierabend? 🌙';
  };

  useEffect(() => {
    // Timer for time updates
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Timer for content updates - only fetch if connected
    const contentTimer = setInterval(() => {
      if (isServerConnected) {
        fetchQuotes();
        fetchWeather();
        fetchFacts();
      }
    }, 300000);

    // NASA info auto-toggle timer
    const nasaInfoTimer = setInterval(() => {
      setShowNasaInfo(prev => !prev);
    }, 60000);

    // Initial fetches
    fetchQuotes();
    fetchWeather();
    fetchFacts();
    fetchNasaImage();
    fetchGreetings();

    return () => {
      clearInterval(timer);
      clearInterval(contentTimer);
      clearInterval(nasaInfoTimer);
    };
  }, [isServerConnected]); // Re-run when connection status changes

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

        {!isServerConnected && (
          <div className="offline-badge">
            <span className="text-yellow-300">⚠️ Offline Mode - Using Cached Data</span>
          </div>
        )}

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
              <p className="quote-text text-yellow-300">{error}</p>
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