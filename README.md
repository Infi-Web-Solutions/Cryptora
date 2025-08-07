# Cryptora

## Overview
This project is a cryptocurrency platform built using Django and Web3. It allows users to manage their cryptocurrency portfolios, perform transactions, and interact with blockchain-based smart contracts. The platform integrates with Binance and CoinGecko APIs for live price data and market information.

## Features
- **Dashboard**: View virtual USD balance, transaction history, and current holdings.
- **Buy/Sell Coins**: Perform cryptocurrency transactions with live price updates.
- **Borrow/Repay Funds**: Request and repay virtual USD funds.
- **Transaction History**: View detailed transaction logs.
- **Watchlist**: Manage a watchlist of favorite cryptocurrencies.
- **Market Data**: Fetch live and historical market data.

## Technologies Used
- **Backend**: Django framework
- **Blockchain**: Web3.py for smart contract interactions
- **APIs**: Binance API, CoinGecko API
- **Database**: SQLite (default Django database)

<!-- ## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd crypto_platform
   ``` -->

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply migrations:
   ```bash
   python manage.py migrate
   ```

5. Run the development server:
   ```bash
   python manage.py runserver
   ```

6. Access the platform at `http://127.0.0.1:8000/`.

## Configuration
- Update `crypto_platform/settings.py` with your Web3 provider and smart contract details.
- Add your Binance and CoinGecko API keys if required.
- **Set up your wallet**:
  1. Add your wallet address and private key to the environment variables or a secure configuration file.
  2. Ensure the private key is stored securely and not hardcoded in the source code.
  3. Example for `.env` file:
     ```env
     WALLET_ADDRESS=your_wallet_address_here
     PRIVATE_KEY=your_private_key_here
     ```

## Usage
- **Admin Panel**: Access the Django admin panel at `/admin-login` to manage users and data.
- **Dashboard**: Log in to view your portfolio and perform transactions.

## File Structure
- `crypto_platform/`: Core Django project files.
- `dashboard/`: Contains views, models, and utilities for the platform.
- `user/`: Handles user authentication and profile management.
- `static/`: Static files (CSS, JS, images).
- `templates/`: HTML templates for the platform.
- `smartcontract/`: Contains the Solidity smart contract file.

## Key Functions
- **`get_live_price(symbol)`**: Fetches live price for a cryptocurrency.
- **`buy_coin(user_wallet, symbol, price, quantity)`**: Executes a buy transaction.
- **`sell_coin(user_wallet, symbol, price, quantity)`**: Executes a sell transaction.
- **`request_virtual_funds(amount)`**: Requests virtual USD funds.
- **`repay_virtual_funds(user_wallet, amount)`**: Repays borrowed funds.

## Smart Contract Deployment
For deploying the smart contract, Remix IDE (an online Solidity IDE) was used. Remix IDE provides a user-friendly interface for writing, testing, and deploying smart contracts directly to the blockchain. You can access it at [Remix IDE](https://remix.ethereum.org/).

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## Contact
For any inquiries or support, please contact [your-email@example.com].

## Testing
To ensure the platform works as expected, test cases have been implemented. Follow these steps to run the tests:

1. Navigate to the project directory:
   ```bash
   cd cryptora
   ```

2. Run the tests using Django's test framework:
   ```bash
   python manage.py test
   ```

### Test Coverage
- **Unit Tests**: Cover individual functions and methods, such as `get_live_price`, `buy_coin`, and `sell_coin`.
- **Integration Tests**: Validate the interaction between different components, such as views and utilities.
- **End-to-End Tests**: Simulate user actions to ensure the platform behaves as expected.

### Adding New Tests
To add new test cases, create or update files in the `tests.py` files located in the respective app directories (e.g., `dashboard/tests.py`, `user/tests.py`). Use Django's `TestCase` class to define your tests.
