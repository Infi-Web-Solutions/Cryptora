document.addEventListener("DOMContentLoaded", function () {
  const chartContainer = document.getElementById('marketHighChart');
  const timePeriodButtons = document.querySelectorAll('.time-period-selector .btn');
  const metricDropdownItems = document.querySelectorAll('[data-metric]');
  const totalMarketCapEl = document.getElementById('totalMarketCap');
  const marketCapChangeEl = document.getElementById('marketCapChange');
  const totalVolumeEl = document.getElementById('totalVolume');
  const btcDominanceEl = document.getElementById('btcDominance');
  let currentMetric = 'market_cap';
  let currentDays = '1'; // Default to 'Today'

  Highcharts.setOptions({
    chart: {
      backgroundColor: 'rgba(26,26,46,1)',
      style: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
    },
    title: { style: { color: '#fff' } },
    xAxis: { labels: { style: { color: '#ccc' } } },
    yAxis: {
      gridLineColor: 'rgba(255,255,255,0.1)',
      labels: { style: { color: '#ccc' } }
    },
    tooltip: {
      backgroundColor: '#1e1e2f',
      style: { color: '#fff' },
      borderColor: '#4bc0c0'
    }
  });

  function fetchGlobalStats() {
    const url = 'https://api.coingecko.com/api/v3/global';
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        const stats = data.data;
        totalMarketCapEl.textContent = `$${formatNumber(stats.total_market_cap.usd)}`;
        marketCapChangeEl.textContent = `${stats.market_cap_change_percentage_24h_usd >= 0 ? '+' : ''}${stats.market_cap_change_percentage_24h_usd.toFixed(2)}%`;
        marketCapChangeEl.className = `badge ${stats.market_cap_change_percentage_24h_usd >= 0 ? 'positive' : 'negative'}`;
        totalVolumeEl.textContent = `$${formatNumber(stats.total_volume.usd)}`;
        btcDominanceEl.textContent = `${stats.market_cap_percentage.btc.toFixed(1)}%`;

        const volumeChangeEl = document.getElementById('volumeChange');
        const dominanceChangeEl = document.getElementById('dominanceChange');

        // Safely display volume change
        if (stats.volume_change_percentage_24h_usd !== undefined && stats.volume_change_percentage_24h_usd !== null) {
            volumeChangeEl.textContent = `${stats.volume_change_percentage_24h_usd >= 0 ? '+' : ''}${stats.volume_change_percentage_24h_usd.toFixed(2)}%`;
            volumeChangeEl.className = `badge ${stats.volume_change_percentage_24h_usd >= 0 ? 'positive' : 'negative'}`;
        } else {
            volumeChangeEl.textContent = '--%';
            volumeChangeEl.className = `badge`; // Reset class if data is missing
        }

        // Safely display dominance change
        if (stats.dominance_change_percentage_24h !== undefined && stats.dominance_change_percentage_24h !== null) {
            dominanceChangeEl.textContent = `${stats.dominance_change_percentage_24h >= 0 ? '+' : ''}${stats.dominance_change_percentage_24h.toFixed(2)}%`;
            dominanceChangeEl.className = `badge ${stats.dominance_change_percentage_24h >= 0 ? 'positive' : 'negative'}`;
        } else {
            dominanceChangeEl.textContent = '--%';
            dominanceChangeEl.className = `badge`; // Reset class if data is missing
        }
      });
  }

  function fetchMarketChart(days) {
    const url = `https://api.coingecko.com/api/v3/global`;
    return fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        const marketCaps = data.data.total_market_cap;
        if (!marketCaps || typeof marketCaps.usd !== 'number') {
          throw new Error('Invalid market cap format');
        }

        let timestamps;

        if (days === '1') {
          const now = Date.now();
          const tenMinutes = 10 * 60 * 1000;
          timestamps = Array.from({ length: 144 }, (_, i) => now - (143 - i) * tenMinutes);
          return timestamps.map((timestamp, index) => [
            timestamp,
            marketCaps.usd * (1 + 0.001 * Math.sin(index)) // Simulate realistic variation
          ]);
        } else {
          const interval = {
            '7': 1,
            '14': 1,
            '30': 1,
            '90': 3,
            '365': 12,
            '1095': 36,
            '1825': 60
          }[days] || 1;

          timestamps = Array.from({ length: Math.floor(days / interval) }, (_, i) =>
            Date.now() - (Math.floor(days / interval) - 1 - i) * interval * 86400000
          );

          return timestamps.map((timestamp, index) => [
            timestamp,
            marketCaps.usd * (1 - index * 0.005)
          ]);
        }
      })
      .catch(error => {
        console.error('[ERROR] fetchMarketChart failed:', error);
        throw error;
      });
  }

  function renderChart(data, title, days) {
    Highcharts.chart('marketHighChart', {
      chart: { type: 'line', height: 300 },
      title: { text: title },
      xAxis: {
        type: 'datetime',
        title: { text: 'Date' },
        labels: {
          formatter: function () {
            return days === '1'
              ? Highcharts.dateFormat('%H:%M', this.value)
              : Highcharts.dateFormat('%b %e', this.value);
          }
        }
      },
      yAxis: {
        title: { text: 'Market Cap (USD)' },
        labels: {
          formatter: function () {
            return this.value >= 1e12 ? '$' + (this.value / 1e12).toFixed(2) + 'T' :
                   this.value >= 1e9 ? '$' + (this.value / 1e9).toFixed(2) + 'B' :
                   '$' + this.value.toLocaleString();
          }
        },
        tickAmount: 5 // Ensure at least 5 intervals on the Y-axis
      },
      tooltip: {
        shared: true,
        formatter: function () {
          return `<b>${Highcharts.dateFormat('%b %e, %Y %H:%M', this.x)}</b><br/>` +
                 `<span style="color:${this.points[0].color}">●</span> Market Cap: <b>$${this.points[0].y.toLocaleString()}</b>`;
        },
        useHTML: true
      },
      series: [
        {
          name: 'Market Cap',
          data: data,
          color: '#4bc0c0',
          marker: {
            enabled: true,
            radius: 4,
            symbol: 'circle'
          },
          lineWidth: 2,
          states: {
            hover: {
              lineWidth: 3
            }
          }
        }
      ],
      credits: { enabled: false }
    });
  }

  function updateChart(days) {
    currentDays = parseInt(days);
    fetchMarketChart(days)
      .then(data => {
        renderChart(data, `Total Crypto Market Cap (${days === '1' ? 'Today' : `Last ${days} Days`})`, days);
      })
      .catch(error => {
        console.error('Error fetching or rendering chart data:', error);
        chartContainer.innerHTML = '<p class="text-light">Unable to load chart data. Please try again later.</p>';
      });
  }

  timePeriodButtons.forEach(button => {
    button.addEventListener('click', function () {
      document.querySelector('.time-period-selector .active')?.classList.remove('active');
      this.classList.add('active');
      const days = this.getAttribute('data-days');
      updateChart(days);
    });
  });

  metricDropdownItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector('[data-metric].active')?.classList.remove('active');
      this.classList.add('active');
      currentMetric = this.getAttribute('data-metric');
      document.getElementById('metricDropdown').innerHTML = `<i class="fas fa-chart-bar me-1"></i> ${this.textContent}`;
      updateChart(currentDays);
    });
  });

  function formatNumber(n) {
    return n >= 1e12 ? (n / 1e12).toFixed(2) + 'T' :
           n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' :
           n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n.toLocaleString();
  }

  // Add this function to render coins in HTML
  function renderTop9Coins(coins) {
      console.log('Attempting to render coins:', coins);
      
      // Use the specific container ID
      const coinsContainer = document.getElementById('coinsContainer');
      console.log('Found container:', coinsContainer);
      
      if (!coinsContainer) {
          console.error('Could not find coins container with ID coinsContainer');
          return;
      }

      // Remove loading placeholder if it exists
      const loadingPlaceholder = document.getElementById('loadingPlaceholder');
      if (loadingPlaceholder) {
          loadingPlaceholder.remove();
      }

      const coinsHTML = coins.map(coin => {
          // Extract the base symbol (remove USDT)
          const baseSymbol = coin.symbol.replace('USDT', '');
          const priceChange = parseFloat(coin.priceChangePercent);
          const price = parseFloat(coin.price);
          
          console.log(`Rendering coin: ${baseSymbol} with price: ${price} and change: ${priceChange}%`);

          return `
              <div class="col-md-4 mb-4">
                  <a href="/coin/${baseSymbol.toLowerCase()}" class="text-decoration-none text-white">
                      <div class="bg-dark rounded shadow-sm p-3 coin-card-hover">
                          <div class="d-flex align-items-center justify-content-between">
                              <div class="d-flex align-items-center">
                                  <img 
                                      src="https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${baseSymbol.toLowerCase()}.png" 
                                      alt="${baseSymbol}" 
                                      width="36" 
                                      height="36" 
                                      class="me-2" 
                                      onerror="this.src='https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/icon/generic.png'"
                                  />
                                  <div>
                                      <div class="fw-bold">${baseSymbol}</div>
                                      <div class="small text-warning">USDT Pair</div>
                                  </div>
                              </div>
                              <div class="text-end">
                                  <h5 class="mb-1">$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})}</h5>
                                  <span class="badge ${priceChange >= 0 ? 'positive' : 'negative'}">
                                      ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%
                                  </span>
                              </div>
                          </div>
                          <div class="mt-2 small text-warning">
                              24h Volume: $${(coin.volume).toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </div>
                      </div>
                  </a>
              </div>
          `;
      }).join('');

      console.log('Generated HTML length:', coinsHTML.length);
      
      // Set the HTML content
      coinsContainer.innerHTML = coinsHTML;
      
      console.log('Coins rendered successfully');
  }

  // Modify the fetchTop9CoinsFromBinance function
  function fetchTop9CoinsFromBinance() {
      console.log('[DEBUG] fetchTop9CoinsFromBinance called');
      const url = 'https://api.binance.com/api/v3/ticker/24hr';

      return fetch(url)
          .then(response => {
              if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
              return response.json();
          })
          .then(data => {
              if (!Array.isArray(data) || data.length === 0) {
                  throw new Error('Invalid or empty coin data from Binance');
              }

              // Filter only USDT pairs and get top traded coins
              const top9 = data
                  .filter(coin => coin.symbol.endsWith('USDT'))
                  .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                  .slice(0, 9)
                  .map(coin => ({
                      symbol: coin.symbol,
                      price: parseFloat(coin.lastPrice),
                      volume: parseFloat(coin.quoteVolume),
                      priceChangePercent: parseFloat(coin.priceChangePercent)
                  }));

              console.log('[DEBUG] Top 9 coins from Binance:', top9);
              return top9;
          })
          .catch(err => {
              console.error('[ERROR] fetchTop9CoinsFromBinance:', err);
              return [];
          });
  }

  // Function to update coins periodically
  function updateCoins() {
      console.log('Starting coin update...');
      
      // Show loading state
      const coinsContainer = document.getElementById('coinsContainer');
      if (coinsContainer && !document.getElementById('loadingPlaceholder')) {
          coinsContainer.innerHTML = `
              <div class="col-12 text-center py-5" id="loadingPlaceholder">
                  <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="text-light mt-3">Loading top cryptocurrencies...</p>
              </div>
          `;
      }

      fetchTop9CoinsFromBinance()
          .then(coins => {
              if (!coins || coins.length === 0) {
                  throw new Error('No coins data received');
              }
              console.log(`Received ${coins.length} coins to render`);
              renderTop9Coins(coins);
          })
          .catch(error => {
              console.error('Error updating coins:', error);
              if (coinsContainer) {
                  coinsContainer.innerHTML = `
                      <div class="col-12 text-center py-5">
                          <div class="text-danger mb-3">
                              <i class="fas fa-exclamation-triangle fa-2x"></i>
                          </div>
                          <p class="text-light">Unable to load cryptocurrency data. Please try again later.</p>
                          <button class="btn btn-outline-primary btn-sm mt-2" onclick="updateCoins()">
                              <i class="fas fa-sync-alt me-1"></i> Retry
                          </button>
                      </div>
                  `;
              }
          });
  }

  // Initial load
  fetchGlobalStats();
  updateChart(currentDays);
  updateCoins();

  // Update coins every 30 seconds
  setInterval(updateCoins, 30000);

  function fetchTop9Coins() {
  console.log('[DEBUG] fetchTop9Coins called');
  return fetch('/api/top-coins/')
    .then(res => {
      console.log('[DEBUG] /api/top-coins/ status:', res.status);
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid or empty coin data');
      }
      // Assuming the endpoint returns more than 9 coins, slice the first 9
      const top9 = data.slice(0, 9);
      console.log('[DEBUG] Top 9 coins:', top9);
      return top9;
    })
    .catch(err => {
      console.error('[ERROR] fetchTop9Coins:', err);
      return [];
    });
}
fetchTop9Coins();
});

