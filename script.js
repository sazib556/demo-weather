// Open-Meteo is used — no API key is required.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const button = form.querySelector("button");
const message = document.getElementById("message");
const result = document.getElementById("result");

function describe(code) {
  if (code === 0) return ["☀️", "Clear sky"];
  if (code <= 2) return ["🌤️", "Partly cloudy"];
  if (code === 3) return ["☁️", "Cloudy"];
  if (code === 45 || code === 48) return ["🌫️", "Fog"];
  if (code >= 51 && code <= 57) return ["🌦️", "Light rain"];
  if (code >= 61 && code <= 67) return ["🌧️", "Rain"];
  if (code >= 71 && code <= 77) return ["❄️", "Snowfall"];
  if (code >= 80 && code <= 82) return ["🌧️", "Heavy rain"];
  if (code >= 95) return ["⛈️", "Thunderstorm"];
  return ["🌡️", "Unknown"];
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
  message.hidden = false;
}

async function getWeather(city) {
  const geoRes = await fetch(
    `${GEO_URL}?name=${encodeURIComponent(city)}&count=1`,
  );
  if (!geoRes.ok) throw new Error("There is a server issue.");
  const geo = await geoRes.json();
  if (!geo.results || geo.results.length === 0) {
    throw new Error(`No city found with the name "${city}".`);
  }
  const { latitude, longitude, name, country } = geo.results[0];

  const url =
    `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code`;
  const wRes = await fetch(url);
  if (!wRes.ok) throw new Error("Weather data could not be retrieved.");
  const w = (await wRes.json()).current;

  return {
    place: country ? `${name}, ${country}` : name,
    temp: Math.round(w.temperature_2m),
    humidity: w.relative_humidity_2m,
    code: w.weather_code,
  };
}

function render(data) {
  const [icon, text] = describe(data.code);
  document.getElementById("icon").textContent = icon;
  document.getElementById("city-name").textContent = data.place;
  document.getElementById("description").textContent = text;
  document.getElementById("temp").textContent = `${data.temp}°C`;
  document.getElementById("humidity").textContent = `${data.humidity}%`;
  result.hidden = false;
  message.hidden = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;

  button.disabled = true;
  result.hidden = true;
  showMessage("Loading...");

  try {
    render(await getWeather(city));
  } catch (err) {
    showMessage(err.message || "Something went wrong, please try again.", true);
  } finally {
    button.disabled = false;
  }
});
