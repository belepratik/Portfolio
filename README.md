# Crypto Portfolio Tracker

A full-stack application for tracking cryptocurrency futures trading activities.

## Project Structure

```
Portfolio2/
├── frontend/          # React + Vite application
├── backend/           # Spring Boot REST API
└── project-plan.txt   # Detailed project plan
```

## Prerequisites

- **Java 17** or higher
- **Node.js 18** or higher
- **MySQL Server** installed and running
- **Maven** (or use the Maven wrapper)

## Database Setup

1. Open MySQL and create the database:

```sql
CREATE DATABASE portfolio_db;
```

2. Update the database credentials in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.username=root
spring.datasource.password=your_password_here
```

## Running the Backend

```bash
cd backend

# Using Maven
mvn spring-boot:run

# Or using Maven wrapper (if available)
./mvnw spring-boot:run
```

The backend will start on **http://localhost:8080**

## Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on **http://localhost:5173**

## Features

### Trade Entry Fields
- Coin/Token (BTC, ETH, SOL, etc.)
- Trade Type (LONG / SHORT)
- Entry Price
- Exit Price
- Quantity
- Leverage (1x - 125x)
- Fees (Trading + Funding)
- Exchange (Binance, Bybit, etc.)
- Status (OPEN / CLOSED)
- Stop Loss & Take Profit
- Notes

### Dashboard Statistics
- Total P&L (All-time)
- Today's P&L
- Weekly P&L
- Monthly P&L
- Win Rate
- Total/Open/Closed Trades
- Average Profit/Loss

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/trades | Get all trades |
| GET | /api/trades/{id} | Get trade by ID |
| POST | /api/trades | Create new trade |
| PUT | /api/trades/{id} | Update trade |
| DELETE | /api/trades/{id} | Delete trade |
| PATCH | /api/trades/{id}/close | Close a trade |
| GET | /api/trades/summary | Get dashboard stats |
| GET | /api/trades/coin/{coin} | Filter by coin |
| GET | /api/trades/status/{status} | Filter by status |

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Axios
- **Backend**: Spring Boot 3.2, Spring Data JPA
- **Database**: MySQL
- **Styling**: Custom CSS (Dark theme)

## Future Enhancements

- [ ] Charts and visualizations
- [ ] Export to CSV/Excel
- [ ] User authentication
- [ ] Multiple portfolios
- [ ] Real-time price tracking
- [ ] Trade import from exchanges
