# AgricTech Platform - Complete Agricultural Technology Solution

[![Node.js](https://img.shields.io/badge/Node.js-16.x+-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.x+-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

A comprehensive agricultural technology platform designed for farmers, extension officers, and agricultural businesses. Built with monetization features, SMS/WhatsApp notifications, marketplace functionality, and premium analytics.

## 🌟 Features

### Core Features
- ✅ **User Authentication & Role Management** (Farmer, Extension Officer, Admin)
- ✅ **Real-time Crop Price Updates** with WebSocket support
- ✅ **Weather Information** integration
- ✅ **Farming Tips & Best Practices** content management
- ✅ **Youth Training Programs** with progress tracking
- ✅ **Community Security Reports** system

### Monetization Features (New)
- 💰 **Subscription Management** (Free, Basic, Pro, Premium tiers)
- 📊 **Premium Analytics** with AI-powered price predictions
- 🛒 **Marketplace** for buying/selling agricultural products
- 🎓 **Paid Training Courses** with certificates
- 📈 **Advanced Data Export** (CSV, Excel, PDF)
- 💳 **Multi-Payment Gateway** support (Stripe, Paystack, Flutterwave)

### Notification System (New)
- 📱 **SMS Notifications** via Twilio
- 📞 **WhatsApp Integration** for alerts and updates
- 🔔 **Real-time Price Alerts** with customizable conditions
- 📧 **Email Notifications** for important updates
- ⏰ **Scheduled Notifications** and reminders

### Admin Dashboard (New)
- 📊 **Revenue Analytics** and tracking
- 👥 **User Management** and monitoring
- 📈 **System Health** monitoring
- 📋 **Content Management** tools
- 🎯 **Bulk Notification** system

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- MongoDB 5.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/agrictech-platform.git
cd agrictech-platform/server
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the API**
- Development: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

## 🔧 Configuration

### Required Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/agrictech

# JWT Security
JWT_SECRET=your-secure-jwt-secret

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# WhatsApp Business API
WHATSAPP_PHONE_ID=your-whatsapp-phone-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
```

### Payment Gateway Setup

#### Stripe (International)
1. Create account at https://stripe.com
2. Get API keys from dashboard
3. Set webhook endpoint for subscription events

#### Paystack (Nigeria)
1. Create account at https://paystack.com
2. Get API keys from settings
3. Configure webhook for payment events

#### Flutterwave (Africa)
1. Create account at https://flutterwave.com
2. Get API keys from dashboard
3. Configure webhook URL

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/forgot-password - Password reset
```

### Premium Features
```
GET /api/premium/analytics - Advanced crop analytics
POST /api/premium/price-predictions - AI price predictions
GET /api/premium/export/csv - Data export (CSV)
GET /api/premium/export/pdf - Data export (PDF)
POST /api/premium/alerts - Custom price alerts
GET /api/premium/market-comparison - Market comparisons
```

### Marketplace
```
GET /api/marketplace/listings - Get product listings
POST /api/marketplace/listings - Create product listing
POST /api/marketplace/orders - Place order
PATCH /api/marketplace/orders/:id - Update order status
GET /api/marketplace/transactions - User transactions
POST /api/marketplace/reviews - Create review
```

### Training System
```
GET /api/training/courses - Browse courses
POST /api/training/enroll - Enroll in course
PATCH /api/training/progress - Update progress
GET /api/training/certificate/:courseId - Get certificate
```

### Notifications
```
GET /api/notifications/preferences - Get preferences
PATCH /api/notifications/preferences - Update preferences
GET /api/notifications/alerts - Get price alerts
POST /api/notifications/alerts - Create price alert
GET /api/notifications/inbox - Get notifications
PATCH /api/notifications/inbox/:id/read - Mark as read
```

### Admin Dashboard
```
GET /api/admin/dashboard - Dashboard overview
GET /api/admin/users - User management
GET /api/admin/revenue - Revenue analytics
GET /api/admin/system/health - System health
POST /api/admin/notifications/send-bulk - Bulk notifications
```

## 🎯 Subscription Tiers

### Free Tier
- 3 price alerts
- Basic crop prices
- Community features
- Limited marketplace access

### Basic Tier ($9.99/month)
- 10 price alerts
- Weekly analytics reports
- Full marketplace access
- Basic training courses

### Pro Tier ($19.99/month)
- 20 price alerts
- Daily analytics reports
- Advanced market insights
- All training courses
- Priority support

### Premium Tier ($39.99/month)
- 50 price alerts
- Real-time analytics
- AI price predictions
- Custom reports
- Marketplace commission reduction
- White-label options

## 📱 Notification Features

### SMS Alerts
- Price threshold alerts
- Market updates
- Order notifications
- System announcements

### WhatsApp Integration
- Rich message formatting
- Template messages
- Media sharing
- Interactive responses

### Intelligent Scheduling
- Quiet hours respect
- Time zone awareness
- Frequency management
- Priority-based delivery

## 🛒 Marketplace Features

### Product Listings
- Crop variety details
- Quality specifications
- Pricing and availability
- Delivery information
- Seller verification

### Order Management
- Order placement and tracking
- Payment processing
- Delivery coordination
- Dispute resolution

### Commission Structure
- Platform commission (5% default)
- Reduced rates for premium users
- Transparent fee structure
- Automated calculations

## 🎓 Training System

### Course Management
- Video content delivery
- Progress tracking
- Quiz assessments
- Certificate generation

### Payment Integration
- One-time course purchases
- Subscription access
- Bulk enrollment discounts
- Corporate training packages

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation and sanitization
- HTTPS enforcement
- Password encryption (bcrypt)
- SQL injection prevention
- XSS protection

## 📊 Analytics & Reporting

### User Analytics
- Registration trends
- Engagement metrics
- Feature usage
- Retention rates

### Revenue Analytics
- Subscription revenue
- Marketplace commissions
- Training course sales
- Payment method analysis

### System Monitoring
- API response times
- Error rates
- Database performance
- User activity

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Coming Soon)
```bash
docker-compose up -d
```

### Environment-specific Configs
- Development: Real-time reloading
- Production: Optimized performance
- Testing: Mock external services

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Coverage Report
```bash
npm run test:coverage
```

### API Testing
```bash
# Using curl
curl -X GET http://localhost:5000/api/health

# Using Postman
Import the provided Postman collection
```

## 📈 Performance Optimization

- MongoDB indexing for faster queries
- Redis caching for frequently accessed data
- Image optimization with Sharp
- Compression middleware
- Connection pooling
- Lazy loading for large datasets

## 🔄 Background Jobs

### Scheduled Tasks
- Price alert processing (every 15 minutes)
- Subscription renewal reminders (daily)
- Database backups (nightly)
- Analytics aggregation (hourly)
- Notification rate limit cleanup (hourly)

### Queue Management
- Asynchronous job processing
- Retry mechanisms
- Dead letter queues
- Job monitoring

## 🌍 Internationalization

- Multi-language support framework
- Currency localization
- Date/time formatting
- Regional payment methods
- Local market data integration

## 📞 Support

### Documentation
- API documentation with Swagger/OpenAPI
- Integration guides
- Best practices
- Troubleshooting guides

### Community
- GitHub Issues
- Discussion forums
- Developer Slack channel
- Email support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for farmers and agricultural communities
- Inspired by the need for accessible agricultural technology
- Special thanks to the open-source community
- Powered by modern web technologies

## 📞 Contact

- **Email**: support@agrictech.com
- **Website**: https://agrictech.com
- **GitHub**: https://github.com/your-username/agrictech-platform
- **Twitter**: @AgricTechPlatform

---

**Made with ❤️ for farmers and agricultural communities worldwide**
