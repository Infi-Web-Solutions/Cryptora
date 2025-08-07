document.addEventListener('DOMContentLoaded', function () {
    const allCoinsContainer = document.getElementById('allCoinsContainer');

    function fetchTop100Coins() {
        const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1';
        fetch(url)
            .then(response => response.json())
            .then(data => {
                renderCoins(data);
            })
            .catch(error => {
                console.error('Error fetching top 100 coins:', error);
            });
    }

    function renderCoins(coins) {
        allCoinsContainer.innerHTML = '';
        allCoinsContainer.innerHTML = coins.map(coin => {
            const baseSymbol = coin.symbol.toUpperCase();
            const price = coin.current_price;
            const priceChange = coin.price_change_percentage_24h;
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
                                24h Volume: $${(coin.total_volume).toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                        </div>
                    </a>
                </div>
            `;
        }).join('');
    }

    fetchTop100Coins();
});