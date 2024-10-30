import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Moon, Quote, Coffee, Wind, MapPin, Clock, Cloud, Droplets, CloudSnow, Info } from 'lucide-react';
import '../styles/dynamicDailyView.css';
import { config } from '../../../config/config';

const bodenseeFacts = [
  "Der Bodensee ist mit 536 km² der drittgrößte See Mitteleuropas.",
  "Friedrichshafen ist bekannt für seine Zeppelin-Geschichte.",
  "Der Bodensee grenzt an drei Länder: Deutschland, Österreich und die Schweiz.",
  "Die Stadt wurde nach König Friedrich I. von Württemberg benannt.",
  "Der Bodensee versorgt rund 4,5 Millionen Menschen mit Trinkwasser.",
  "Das Zeppelin Museum in Friedrichshafen ist das größte Luftfahrtmuseum der Welt.",
  "Die Region ist bekannt für ihren Weinbau und Obstanbau.",
  "Der See wird auch 'Schwäbisches Meer' genannt."
];

const getGermanGreeting = (hour) => {
  if (hour >= 5 && hour < 12) return 'Guten Morgen';
  if (hour >= 12 && hour < 17) return 'Guten Tag';
  if (hour >= 17 && hour < 22) return 'Guten Abend';
  return 'Gute Nacht';
};

const getWeatherIcon = (weatherCode) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  if (weatherCode <= 1) return <Sun className="weather-icon text-yellow-300" />;
  if (weatherCode <= 3) return <Cloud className="weather-icon text-gray-300" />;
  if (weatherCode <= 49) return <Droplets className="weather-icon text-blue-300" />;
  if (weatherCode <= 69) return <CloudSnow className="weather-icon text-white" />;
  if (weatherCode <= 79) return <CloudSnow className="weather-icon text-blue-200" />;
  if (weatherCode <= 99) return <Cloud className="weather-icon text-gray-400" />;
  return <Sun className="weather-icon text-yellow-300" />;
};

const DynamicDailyView = () => {
  const [time, setTime] = useState(new Date());
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fact, setFact] = useState(bodenseeFacts[0]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [weather, setWeather] = useState(null);
  const [nasaImage, setNasaImage] = useState(null);
  const [showNasaInfo, setShowNasaInfo] = useState(false);

  const fetchNasaImage = async () => {
    try {
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${config.apiKeys.NASA_API_KEY}`);
      const data = await response.json();
      setNasaImage(data);
    } catch (err) {
      console.error('Failed to fetch NASA image:', err);
    }
  };

  const fetchWeather = async () => {
    try {
      // First, get coordinates for the location
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(config.info.location)}&count=1`
      );
      const geoData = await geoResponse.json();
      
      if (!geoData.results?.[0]) {
        throw new Error('Location not found');
      }

      const { latitude, longitude } = geoData.results[0];
      
      // Then get weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
      );
      const weatherData = await weatherResponse.json();
      
      setWeather(weatherData.current_weather);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Failed to load weather data');
    }
  };

  const fetchQuote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.quotable.io/random');
      if (!response.ok) throw new Error('Failed to fetch quote');
      const data = await response.json();

      setQuote({
        text: data.content,
        author: data.author,
      });
    } catch (err) {
      setError('Failed to load quote. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const contentTimer = setInterval(() => {
      fetchQuote();
      fetchWeather();
      setFact(bodenseeFacts[Math.floor(Math.random() * bodenseeFacts.length)]);
    }, 300000);

    const nasaInfoTimer = setInterval(() => {
      setShowNasaInfo(prev => !prev);
    }, 30000); // Toggle every 10 seconds

    // Initial fetches
    fetchQuote();
    fetchWeather();
    fetchNasaImage(); // Fetch NASA image once per day is enough as it updates daily

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
    <div className="daily-view">
      {nasaImage && (
        <>
          <div 
            className="nasa-background" 
            style={{ backgroundImage: `url(${nasaImage.url})` }}
          />
          <div className="background-overlay" />
        </>
      )}
      
      <div className="background-effects">
        <div className="shooting-star"></div>
        <div className="shooting-star delay-1"></div>
        <div className="shooting-star delay-2"></div>
      </div>

      <div className="content-wrapper">
        <div className="dhbw-logo">
          <img src="/dhbw.png" alt="DHBW Logo" />
        </div>

        <div className="location-badge">
          <MapPin className="text-blue-300" />
          <span>{config.info.location}</span>
        </div>

        {/* Rest of the existing content */}
        <div className="main-content">
          <h1 className="greeting-text">{getGermanGreeting(time.getHours())}</h1>

          <div className="datetime-display">
            <div className="date">
              <Calendar className="text-blue-300" />
              <span>{formattedDate}</span>
            </div>
            <div className="time">
              <Clock />
              <span>{formattedTime}</span>
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

        <div className="weather-badge">
          {weather ? (
            <div className="flex flex-col items-center gap-2">
              {getWeatherIcon(weather.weathercode)}
              <span className="text-lg font-bold">{Math.round(weather.temperature)}°C</span>
            </div>
          ) : (
            <Sun className="weather-icon text-yellow-300 animate-pulse" />
          )}
        </div>

        {nasaImage && (
          <div 
            className="nasa-info"
            onClick={() => setShowNasaInfo(!showNasaInfo)}
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-300" />
              <h3 className="nasa-title">{nasaImage.title}</h3>
            </div>
            <p className={`nasa-description ${showNasaInfo ? 'expanded' : ''}`}>
              {nasaImage.explanation}
            </p>
          </div>
        )}

        <div className="decorative-wind">
          <Wind className="text-white/30" />
        </div>
      </div>
    </div>
  );
};

export default DynamicDailyView;