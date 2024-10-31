import React, { useState, useEffect } from 'react';
import { Calendar, Sun, Moon, Quote, Coffee, Wind, MapPin, Clock, Cloud, Droplets, CloudSnow, Info } from 'lucide-react';
import '../styles/dynamicDailyView.css';
import AnimatedWeather from './animatedWeather';
import { config } from '../../../config/config';

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

  const fetchQuotes = async () => {
    try {
      const response = await fetch('src/data/quotes.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      const quotesArray = data.quotes; // Access the quotes array
      const randomIndex = Math.floor(Math.random() * quotesArray.length);
      setQuote(quotesArray[randomIndex]);
      setError(null);
    } catch (err) {
      setError('Failed to load quote. Please try again later. ' + err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacts = async () => {
    try {
      const response = await fetch('src/data/facts.json');
      const data = await response.json();
      const randomIndex = Math.floor(Math.random() * data.length);
      setFact(data[randomIndex]);
    } catch (err) {
      console.error('Failed to fetch facts:', err);
    }
  };

  const fetchGreetings = async () => {
    try {
      const response = await fetch('src/data/greetings.json');
      const data = await response.json();
      setGreetings(data);
    } catch (err) {
      console.error('Failed to fetch greetings:', err);
    }
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
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(config.info.location)}&count=1`
      );
      const geoData = await geoResponse.json();
      
      if (!geoData.results?.[0]) {
        throw new Error('Location not found');
      }

      const { latitude, longitude } = geoData.results[0];
      
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&windspeed_unit=kmh&timezone=auto`
      );
      const weatherData = await weatherResponse.json();
      console.log('Fetched weather:', weatherData);
      
      setWeather(weatherData.current_weather);
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Failed to load weather data');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const contentTimer = setInterval(() => {
      fetchQuotes();
      fetchWeather();
      fetchFacts();
    }, 300000);

    const nasaInfoTimer = setInterval(() => {
      setShowNasaInfo(prev => !prev);
    }, 30000);

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

        <div className="main-content">
          <h1 className="greeting-text">{getGreetings(time.getHours())}</h1>

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
      </div>
    </div>
  );
};

export default DynamicDailyView;