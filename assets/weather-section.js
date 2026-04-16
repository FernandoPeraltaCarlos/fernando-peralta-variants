function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function renderMessage(widget, message, state) {
  widget.classList.remove('weather-section__widget--loading', 'weather-section__widget--error');

  if (state) {
    widget.classList.add(`weather-section__widget--${state}`);
  }

  widget.textContent = message;
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

async function resolveLocationQuery(widget) {
  const configuredCity = widget.dataset.city?.trim();
  const fallbackCity = configuredCity || 'Denver';
  const useVisitorLocation = widget.dataset.useVisitorLocation === 'true';

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

function renderWeather(widget, data) {
  widget.classList.remove('weather-section__widget--loading', 'weather-section__widget--error');
  widget.replaceChildren();

  const content = createElement('div', 'weather-section__content');
  const locationParts = [data.city, data.region, data.country].filter(Boolean);
  content.append(createElement('p', 'weather-section__location', locationParts.join(', ')));

  const summary = createElement('div', 'weather-section__summary');

  if (data.condition_icon) {
    const icon = document.createElement('img');
    icon.className = 'weather-section__icon';
    icon.src = data.condition_icon;
    icon.alt = data.condition || 'Weather icon';
    icon.width = 64;
    icon.height = 64;
    icon.loading = 'lazy';
    summary.append(icon);
  }

  const summaryText = createElement('div', 'weather-section__summary-text');
  const temperature = createElement('div', 'weather-section__temperature');
  temperature.append(createElement('p', 'weather-section__temp-primary', `${data.temp_f}°F`));
  temperature.append(createElement('p', 'weather-section__temp-secondary', `${data.temp_c}°C`));
  summaryText.append(temperature);
  summaryText.append(createElement('p', 'weather-section__condition', data.condition));
  summary.append(summaryText);

  content.append(summary);

  const metaParts = [
    `Feels like ${data.feels_like_f}°F`,
    `Humidity ${data.humidity}%`,
    `Wind ${data.wind_kph} kph ${data.wind_dir}`,
    `UV ${data.uv}`,
  ].filter(Boolean);

  content.append(createElement('p', 'weather-section__meta', metaParts.join(' • ')));

  if (data.last_updated) {
    content.append(createElement('p', 'weather-section__updated', `Last updated: ${data.last_updated}`));
  }

  widget.append(content);
}

async function loadWeather(widget) {
  if (widget.dataset.weatherInitialized === 'true') {
    return;
  }

  widget.dataset.weatherInitialized = 'true';

  const endpoint = widget.dataset.weatherEndpoint?.trim();

  if (!endpoint) {
    renderMessage(widget, 'Weather endpoint is not configured.', 'error');
    return;
  }

  renderMessage(widget, 'Loading weather...', 'loading');

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
    renderMessage(widget, 'Weather data is unavailable right now. Please try again later.', 'error');
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
