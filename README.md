# Code_d_Code Backend Repository

Backend API server for the Code_d_Code student club website.

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js      # Database connection
│   └── schema.sql       # Database schema
├── middleware/
│   └── security.js      # Security & validation
├── routes/
│   ├── contact.js       # Contact form API
│   └── membership.js    # Membership API
├── __tests__/
│   └── api.test.js      # Test suite
├── .env                 # Environment variables
├── .env.production      # Production env template
├── package.json         # Dependencies
└── server.js           # Main server file
```

## 🚀 Quick Deploy

1. **Fork this repository**
2. **Create Supabase project** and get database URL
3. **Deploy to Render.com** with environment variables
4. **Share backend URL** with frontend developer

## 🔗 Frontend Integration

Your frontend developer needs to update API calls to:
```javascript
const API_URL = 'https://your-backend.onrender.com/api';
```

## 📋 Environment Variables for Render

```env
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret-here
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
FRONTEND_URL=https://frontend-url.com
```

## 🧪 Testing

```bash
cd backend
npm install
npm test
```

All 16 tests should pass before deployment.
