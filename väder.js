// API-nyckel
const apiKey = '84e1dce5111ae8795802b1191dd87010'; 

// Funktion för att översätta väderbeskrivningar till svenska
function translateWeatherDescription(description) {
  const translations = {
    'clear sky': 'klar himmel',
    'few clouds': 'lite moln',
    'scattered clouds': 'spridda moln',
    'broken clouds': 'delvis molnigt',
    'shower rain': 'regnskurar',
    'rain': 'regn',
    'thunderstorm': 'åska',
    'snow': 'snö',
    'mist': 'dimma',
    'haze': 'dis',
    'fog': 'dimma',
    'light rain': 'lätt regn',
    'heavy rain': 'kraftigt regn',
    'light snow': 'lätt snö',
    'heavy snow': 'kraftig snö',
    'overcast clouds': 'överdragna moln',
    'clear': 'klar'
  };

  return translations[description] || description; // Om ingen översättning finns, använd originalet
}

// Funktion för att hämta väderdata baserat på användarens position
function showWeather(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  // Bygg väder-API-urlen med latitud, longitud och språket sv (svenska)
  const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=sv`;

  fetch(weatherApiUrl)
    .then(response => response.json())
    .then(data => {
      displayWeather(data);
    })
    .catch(error => {
      console.error('Det gick inte att hämta vädret:', error);
    });
}

// Felhantering för om geolokaliseringen misslyckas
function showError(error) {
  const errorMessage = document.getElementById('error-message');

  switch(error.code) {
    case error.PERMISSION_DENIED:
      errorMessage.textContent = "Användaren nekade att ge tillgång till geolokalisering. Vänligen ge tillstånd i din webbläsare.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMessage.textContent = "Information om positionen är inte tillgänglig.";
      break;
    case error.TIMEOUT:
      errorMessage.textContent = "Timeout när vi försökte hämta din position.";
      break;
    case error.UNKNOWN_ERROR:
      errorMessage.textContent = "Ett okänt fel inträffade.";
      break;
  }
}

// Visa väderinformation på sidan
function displayWeather(data) {
  const weatherElement = document.getElementById('weather');
  const cityName = data.name;
  const temp = data.main.temp;
  const weather = translateWeatherDescription(data.weather[0].description);  // Använd översättningen här
  const wind = data.wind.speed;

  weatherElement.innerHTML = `
    <h2>🌤️ Aktuellt Väder - ${cityName}</h2>
    <p>🌡️ Temperatur: ${temp}°C</p>
    <p>☁️ Väder: ${weather}</p>
    <p>💨 Vind: ${wind} m/s</p>
  `;
}

// Hämta användarens position via geolokalisering
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showWeather, showError);
  } else {
    alert("Geolokalisering stöds inte av denna webbläsare.");
  }
}

// Starta geolokalisering när sidan laddas
document.addEventListener('DOMContentLoaded', function() {
  getLocation();
});
