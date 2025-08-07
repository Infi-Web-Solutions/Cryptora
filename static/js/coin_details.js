document.addEventListener('DOMContentLoaded', function() {
    // Get the coin symbol from the URL
    const pathSegments = window.location.pathname.split('/');
    const symbol = pathSegments[pathSegments.length - 2].toUpperCase(); // Changed to -2 since the last segment is empty
    
    // Initial chart setup with 1 day of data
    fetchChartData(1);

    // Setup event listeners for time period buttons
    document.querySelectorAll('.time-period-selector button').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.time-period-selector button').forEach(btn => {
                btn.classList.remove('active');
            });
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update chart period label
            document.getElementById('priceChartPeriod').textContent = this.textContent;
            
            // Fetch new data
            const days = this.dataset.days;
            fetchChartData(days);
        });
    });

    function fetchChartData(days) {
        // Show loading state
        if (window.chart) {
            window.chart.showLoading('Loading data...');
        }

        // Construct the API URL with the coin symbol
        const url = `/api/market-history/${symbol}/?days=${days}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Received market history data:', data);
                if (data.prices && data.prices.length > 0) {
                    console.log('Creating chart with prices:', data.prices);
                    createChart(data.prices);
                    updatePriceInfo(data.prices);
                } else {
                    console.error('No price data available in response');
                }
            })
            .catch(error => {
                console.error('Error fetching chart data:', error);
                // Show error message to user
                if (window.chart) {
                    window.chart.hideLoading();
                    window.chart.showLoading('Failed to load data');
                }
            });
    }

    function createChart(priceData) {
        // Ensure we have valid price data
        if (!Array.isArray(priceData) || priceData.length === 0) {
            console.error('Invalid or empty price data');
            return;
        }

        console.log('First price point:', priceData[0]);
        console.log('Last price point:', priceData[priceData.length - 1]);

        // Format data for Highcharts (already in correct format from backend)
        const formattedData = priceData;

        // Chart configuration
        const options = {
            chart: {
                type: 'line',
                backgroundColor: 'transparent',
                style: {
                    fontFamily: "'Helvetica Neue', Arial, sans-serif"
                }
            },
            title: {
                text: null
            },
            xAxis: {
                type: 'datetime',
                labels: {
                    style: {
                        color: '#ffffff'
                    }
                },
                gridLineColor: '#2d2d2d',
                lineColor: '#2d2d2d'
            },
            yAxis: {
                title: {
                    text: 'Price (USD)',
                    style: {
                        color: '#ffffff'
                    }
                },
                labels: {
                    style: {
                        color: '#ffffff'
                    },
                    formatter: function() {
                        return '$' + this.value.toFixed(2);
                    }
                },
                gridLineColor: '#2d2d2d'
            },
            series: [{
                name: 'Price',
                data: formattedData,
                color: '#4bc0c0',
                tooltip: {
                    valuePrefix: '$',
                    valueSuffix: ' USD'
                }
            }],
            legend: {
                enabled: false
            },
            tooltip: {
                backgroundColor: '#343a40',
                style: {
                    color: '#ffffff'
                },
                borderColor: '#495057'
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    }
                }
            }
        };

        // Create or update chart
        if (window.chart) {
            window.chart.hideLoading();
            window.chart.update(options, true, true);
        } else {
            window.chart = Highcharts.chart('highPriceChart', options);
        }
    }

    function updatePriceInfo(priceData) {
        if (priceData.length < 2) return;

        // Get current and initial prices
        const currentPrice = priceData[priceData.length - 1][1];
        const initialPrice = priceData[0][1];

        // Calculate percentage change
        const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;

        // Update DOM elements
        document.getElementById('currentPrice').textContent = '$' + currentPrice.toFixed(2);
        
        const priceChangeElement = document.getElementById('priceChange');
        priceChangeElement.textContent = priceChange.toFixed(2) + '%';
        priceChangeElement.className = 'badge ' + (priceChange >= 0 ? 'bg-success' : 'bg-danger');
    }

    // Trading modal functionality
    window.showModal = function(type) {
        const modal = document.getElementById('tradeModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('tradeForm');
        const currentPrice = document.getElementById('initialCoinPrice').textContent.replace('$', '');
        
        document.getElementById('modalCoinPrice').value = currentPrice;
        modalTitle.textContent = type === 'buy' ? 'Buy ' + symbol : 'Sell ' + symbol;
        form.action = type === 'buy' ? '/dashboard/buy/' : '/dashboard/sell/';
        
        modal.classList.remove('d-none');
    };

    window.closeModal = function() {
        document.getElementById('tradeModal').classList.add('d-none');
    };

    window.updateTotal = function() {
        const quantity = document.getElementById('quantityInput').value;
        const price = document.getElementById('modalCoinPrice').value;
        const total = (quantity * price).toFixed(2);
        document.getElementById('totalPrice').textContent = '$' + total;
    };
});
