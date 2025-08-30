# Production Deployment Guide

## Backend Configuration for Vercel with Supabase

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

#### Create Database Schema
Run these SQL commands in your Supabase SQL editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subscription TEXT DEFAULT 'basic' CHECK (subscription IN ('basic', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create policy for inserting profiles (during registration)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', 'Trading User')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 2. Environment Variables

#### Local Development (.env file)
Create a `.env` file in the backend directory:

```bash
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3001
```

#### Vercel Production Environment
Set these environment variables in your Vercel project dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `SUPABASE_URL` | `https://your-project-id.supabase.co` | Production |
| `SUPABASE_ANON_KEY` | `your-anon-key-here` | Production |
| `NODE_ENV` | `production` | Production |

**Important:** Never commit your actual Supabase keys to version control!

### 3. CORS Configuration

Update the CORS origins in `simple-server.js` line 38-40 to match your frontend domains:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app', 'https://ai-trading-bot.vercel.app']
    : true,
  // ...
};
```

### 4. Deployment Commands

#### Install Dependencies
```bash
cd backend
npm install
```

#### Deploy to Vercel
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 5. Authentication Flow

The backend now supports:

#### Registration
- `POST /api/user/register`
- Creates user in Supabase Auth
- Creates profile in database
- Returns user data and success message

#### Login
- `POST /api/auth/login`
- Authenticates with Supabase
- Returns JWT token and user profile
- Frontend should store token for API calls

#### Protected Routes
All trading endpoints now require authentication:
- Include `Authorization: Bearer <token>` header
- Token obtained from login response

#### Token Refresh
- `POST /api/auth/refresh`
- Refreshes expired tokens
- Returns new access token

#### Logout
- `POST /api/auth/logout`
- Invalidates current session

### 6. Frontend Integration

Update frontend API calls to include authentication:

```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// Authenticated API calls
const signalsResponse = await fetch('/api/analysis/top-signals', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 7. Database Maintenance

#### Backup Strategy
- Supabase automatically backs up your database
- Consider additional backups for critical data

#### User Management
- Users managed through Supabase Auth
- Profiles stored in your database
- Subscriptions tracked in profiles table

### 8. Security Considerations

- Environment variables are properly secured
- JWT tokens have expiration
- Row Level Security enabled on database
- CORS properly configured for production
- Input validation with Joi schema
- Proper error handling without exposing sensitive data

### 9. Monitoring and Logs

- Monitor Vercel function logs
- Monitor Supabase database performance
- Set up alerts for authentication failures
- Track API usage and performance

### 10. Troubleshooting

#### Common Issues:
1. **Environment Variables Not Set**: Check Vercel dashboard
2. **CORS Errors**: Verify frontend domain in corsOptions
3. **Database Connection**: Check Supabase URL and keys
4. **Authentication Failures**: Verify token format and expiration

#### Health Check
Test deployment with: `GET /api/health`
Should return Supabase connection status.