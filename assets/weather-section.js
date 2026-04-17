function setState(root, state, statusMessage = '') {
  const widget = root.querySelector('.weather-section__widget');

  if (!widget) {
    return;
  }

  const status = widget.querySelector('[data-weather-status]');
  const content = widget.querySelector('.weather-section__content');

  widget.dataset.state = state;

  if (state !== 'ready') {
    root.dataset.weather = state;
  }

  if (status) {
    status.textContent = statusMessage;
    status.hidden = state === 'ready';
  }

  if (content) {
    content.hidden = state !== 'ready';
  }
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 600000,
    });
  });
}

async function resolveLocationQuery(root) {
  const configuredCity = root.dataset.city?.trim();
  const fallbackCity = configuredCity || 'Denver';
  const useVisitorLocation = root.dataset.useVisitorLocation === 'true';

  if (!useVisitorLocation) {
    return fallbackCity;
  }

  try {
    const position = await getCurrentPosition();
    const latitude = position.coords.latitude?.toFixed(4);
    const longitude = position.coords.longitude?.toFixed(4);

    if (latitude && longitude) {
      return `${latitude},${longitude}`;
    }
  } catch (error) {
    console.warn('Weather section could not detect the visitor location.', error);
  }

  return fallbackCity;
}

function resolveWeatherMood(condition, isDay) {
  const text = (condition || '').toLowerCase();

  if (text.includes('thunder') || text.includes('storm')) return 'storm';
  if (text.includes('snow') || text.includes('blizzard') || text.includes('sleet') || text.includes('ice')) return 'snow';
  if (text.includes('drizzle') || text.includes('rain') || text.includes('shower')) return 'rain';
  if (text.includes('fog') || text.includes('mist') || text.includes('haze') || text.includes('smoke')) return 'mist';
  if (text.includes('overcast') || text.includes('cloud')) return 'cloudy';
  if (text.includes('clear') || text.includes('sun')) return isDay ? 'sunny' : 'night';

  return isDay ? 'sunny' : 'night';
}

function renderWeather(root, data) {
  const isDay = data.is_day === undefined ? true : Boolean(data.is_day);
  root.dataset.weather = resolveWeatherMood(data.condition, isDay);

  const setText = (selector, value) => {
    const element = root.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  };

  setText('[data-weather-location]', [data.city, data.region, data.country].filter(Boolean).join(', '));
  setText('[data-weather-temp-f]', `${data.temp_f}°F`);
  setText('[data-weather-temp-c]', `${data.temp_c}°C`);
  setText('[data-weather-condition]', data.condition || '');
  setText(
    '[data-weather-meta]',
    [
    `Feels like ${data.feels_like_f}°F`,
    `Humidity ${data.humidity}%`,
    `Wind ${data.wind_kph} kph ${data.wind_dir}`,
    `UV ${data.uv}`,
    ]
      .filter(Boolean)
      .join(' • ')
  );

  const icon = root.querySelector('[data-weather-icon]');

  if (icon) {
    if (data.condition_icon) {
      icon.src = data.condition_icon;
      icon.alt = data.condition || 'Weather icon';
      icon.hidden = false;
    } else {
      icon.removeAttribute('src');
      icon.alt = '';
      icon.hidden = true;
    }
  }

  const updated = root.querySelector('[data-weather-updated]');

  if (updated) {
    if (data.last_updated) {
      updated.textContent = `Last updated: ${data.last_updated}`;
      updated.hidden = false;
    } else {
      updated.textContent = '';
      updated.hidden = true;
    }
  }

  setState(root, 'ready');
}

async function loadWeather(widget) {
  if (widget.dataset.weatherInitialized === 'true') {
    return;
  }

  widget.dataset.weatherInitialized = 'true';

  const endpoint = widget.dataset.weatherEndpoint?.trim();

  if (!endpoint) {
    setState(widget, 'error', 'Weather endpoint is not configured.');
    return;
  }

  setState(widget, 'loading', 'Loading weather...');

  try {
    const locationQuery = await resolveLocationQuery(widget);
    const response = await fetch(`${endpoint}?city=${encodeURIComponent(locationQuery)}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }

    const weather = await response.json();
    renderWeather(widget, weather);
  } catch (error) {
    console.error('Weather section failed to load.', error);
    setState(widget, 'error', 'Weather data is unavailable right now. Please try again later.');
  }
}

function initializeWeatherWidgets(container = document) {
  container.querySelectorAll('[data-weather-widget]').forEach((widget) => {
    loadWeather(widget);
  });
}

initializeWeatherWidgets();

document.addEventListener('shopify:section:load', (event) => {
  initializeWeatherWidgets(event.target);
});
