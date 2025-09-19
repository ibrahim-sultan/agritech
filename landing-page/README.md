# AgriTech Landing Page

Beautiful landing page for the Igbaja AgriTech platform with login/register functionality that redirects to the main dashboard.

## ✨ Features

- **Beautiful Design**: Modern gradient design matching your dashboard
- **Responsive**: Works perfectly on mobile, tablet, and desktop
- **Authentication**: Login and register modals with form validation
- **Real API Integration**: Connects to your Render backend API
- **Smooth Animations**: Loading states and transitions
- **Auto-redirect**: Redirects to main app after successful authentication

## 🎯 What It Includes

### Hero Section
- "Kaabo si Igbaja AgriTech! 👋" welcome message
- Current date, mobile optimized badge, active users count
- "Get Started Free" and "Sign In" buttons

### Statistics Cards
- 1,247 Active Users (+12% this week)
- 156 Crop Price Updates (Updated today)  
- 3 Weather Alerts (Active alerts)
- 89 Training Completed (+23 this month)
- 45 Farming Tips (5 new this week)

### Features Section
- Real-time Crop Prices
- Weather Updates
- Skills Training
- Mobile Friendly

### Authentication
- Login modal with email/password
- Register modal with full validation
- Error handling and user feedback
- Automatic redirect to main app

## 🚀 Quick Deploy to Netlify

### Option 1: Drag and Drop
1. Zip the `landing-page` folder
2. Go to [netlify.com](https://netlify.com)
3. Drag the zip file to the deploy area
4. Your landing page will be live instantly!

### Option 2: Connect to GitHub
1. Create a new repository for the landing page
2. Upload these files to the repository
3. Connect the repository to Netlify
4. Auto-deploy on every push

## 📁 Files Structure

```
landing-page/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## 🔧 Configuration

The landing page is pre-configured to work with your existing setup:

- **API URL**: `https://agrictech-3rfg.onrender.com/api`
- **Main App URL**: `https://agrictech01.netlify.app`
- **Authentication**: Full login/register integration

## 🎨 Customization Options

### Change Colors
Edit `styles.css` to customize the gradient and colors:
```css
/* Change the hero gradient */
background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);

/* Change the primary green color */
color: #059669;
background: #059669;
```

### Update Statistics
Edit `index.html` to update the statistics numbers:
```html
<h3 class="stat-number">1,247</h3>
<p class="stat-label">Active Users</p>
<p class="stat-change positive">+12% this week</p>
```

### Modify Features
Update the features section in `index.html`:
```html
<div class="feature-card">
    <i data-lucide="bar-chart-3" class="feature-icon"></i>
    <h3>Your Feature Title</h3>
    <p>Your feature description here.</p>
</div>
```

## 🔗 Integration Flow

1. **User visits landing page**
2. **Clicks Login/Register button**
3. **Fills out form and submits**
4. **Landing page calls your Render API**
5. **On success, redirects to main app**
6. **Main app receives authentication token**

## 🛠️ Development

### Local Testing
1. Open `index.html` in your browser
2. Or use a local server:
   ```bash
   # Using Python
   python -m http.server 3000
   
   # Using Node.js
   npx http-server
   ```

### Demo Mode
For testing without backend, set `DEMO_MODE = true` in `script.js`:
```javascript
const DEMO_MODE = true; // Enable demo mode
```

## 📱 Mobile Responsive

The landing page is fully responsive with:
- Mobile-first design
- Touch-friendly buttons
- Optimized modals for small screens
- Collapsible navigation

## 🔒 Security Features

- Input validation (email format, password length)
- XSS protection with proper escaping
- CORS-compliant API requests
- Secure token storage

## 🎯 Performance

- **Fast Loading**: Minimal dependencies
- **CDN Icons**: Lucide icons from CDN
- **Optimized CSS**: Efficient styling
- **Smooth Animations**: 60fps transitions

## 🚀 Deployment URLs

After deployment, you'll have:
- **Landing Page**: `https://your-landing.netlify.app`
- **Main Dashboard**: `https://agrictech01.netlify.app`
- **API Backend**: `https://agrictech-3rfg.onrender.com/api`

## 🎊 Ready to Deploy!

Your beautiful AgriTech landing page is ready to deploy! It perfectly matches your dashboard design and provides a smooth user experience from landing to authentication to your main application.

Simply upload to Netlify and you'll have a professional landing page that converts visitors into users! 🌾