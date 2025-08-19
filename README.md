# 🌾 Igbaja AgriTech - Advanced Crop Price Management System

A comprehensive agricultural technology platform designed specifically for Igbaja community farmers, featuring real-time crop price tracking, market analysis, and predictive insights.

## 🚀 Features

### 📊 Advanced Crop Price Management
- **Real-time Price Updates**: Live crop price tracking with WebSocket integration
- **Market Comparison**: Compare prices across different markets (Igbaja Local Market, Ilorin Central Market, etc.)
- **Price Predictions**: AI-powered price forecasting using historical data
- **Interactive Charts**: Beautiful price trend visualization with Chart.js
- **Mobile-Responsive Design**: Optimized for all devices

### 🎯 Key Capabilities
- **Multi-language Support**: English and Yoruba language integration
- **Real-time Notifications**: Instant price alerts and updates
- **Market Analytics**: Comprehensive market insights and trends
- **Historical Data**: 30-day price history and trend analysis
- **Filtering & Search**: Advanced filtering by crop, market, season, and availability

### 🌐 Supported Crops
- 🍠 Yam (Isu)
- 🥔 Cassava (Ege)
- 🌽 Maize (Agbado)
- 🍅 Tomatoes (Tomati)
- 🫘 Beans (Ewa)
- 🌶️ Pepper (Ata)

## 🛠 Technology Stack

### Frontend
- **React.js** - Modern UI framework
- **React Router** - Client-side routing
- **Chart.js & React-Chartjs-2** - Data visualization
- **Socket.io-client** - Real-time communication
- **FontAwesome** - Icons and UI elements
- **CSS3** - Responsive styling

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time WebSocket communication
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
AgricTech/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Charts/     # Chart components
│   │   │   ├── Layout/     # Layout components
│   │   │   └── UI/         # UI components
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard/
│   │   │   ├── CropPrices/ # Advanced crop price management
│   │   │   ├── Weather/
│   │   │   └── ...
│   │   ├── services/       # API and WebSocket services
│   │   └── assets/         # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── seedCropPrices.js  # Database seeding
│   └── server.js          # Main server file
├── README.md
├── TODO.md
└── .gitignore
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AgricTech.git
   cd AgricTech
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/agrictech
   PORT=5000
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

5. **Seed the database** (Optional)
   ```bash
   cd server
   node seedCropPrices.js
   ```

6. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm start
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd client
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📡 API Endpoints

### Crop Prices
- `GET /api/crop-prices` - Get all crop prices
- `GET /api/crop-prices/featured` - Get featured prices for dashboard
- `GET /api/crop-prices/analytics` - Get price analytics and trends
- `GET /api/crop-prices/predictions` - Get price predictions
- `GET /api/crop-prices/market-analysis` - Get market analysis
- `GET /api/crop-prices/trends` - Get price trends
- `GET /api/crop-prices/markets/comparison` - Compare prices across markets
- `POST /api/crop-prices` - Create new price entry
- `PUT /api/crop-prices/:id` - Update price entry
- `DELETE /api/crop-prices/:id` - Delete price entry

### WebSocket Events
- `priceUpdate` - Real-time price updates
- `joinPriceUpdates` - Join price updates room
- `subscribeToPriceAlerts` - Subscribe to price alerts

## 🎨 Key Components

### PriceChart Component
Interactive price trend visualization with:
- Real-time data updates
- Price statistics (min, max, average)
- Responsive design
- Customizable time periods

### MarketComparison Component
Market analysis tool featuring:
- Side-by-side price comparison
- Best/worst market identification
- Availability indicators
- Real-time market data

### CropPrices Dashboard
Comprehensive price management with:
- Advanced filtering and search
- Real-time updates
- Price predictions
- Market insights
- Mobile-optimized interface

## 🔧 Configuration

### WebSocket Configuration
The application uses Socket.io for real-time updates. Configure the connection in `client/src/services/socket.js`.

### Database Configuration
MongoDB connection settings are in `server/server.js`. Update the connection string in your `.env` file.

### Chart Configuration
Chart.js settings can be customized in `client/src/components/Charts/PriceChart.js`.

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🌍 Localization

The application supports both English and Yoruba languages:
- Crop names in both languages
- UI elements with cultural context
- Local market integration

## 🔒 Security Features

- Helmet.js for security headers
- Rate limiting for API endpoints
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Environment Variables for Production
```env
MONGODB_URI=your_production_mongodb_uri
PORT=5000
CLIENT_URL=your_production_frontend_url
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **BlackBox AI** - Initial development and implementation
- **Igbaja AgriTech Team** - Requirements and domain expertise

## 🙏 Acknowledgments

- Igbaja farming community for requirements and feedback
- Chart.js team for excellent visualization library
- Socket.io team for real-time communication tools
- MongoDB team for robust database solution

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**Built with ❤️ for the Igbaja farming community**
