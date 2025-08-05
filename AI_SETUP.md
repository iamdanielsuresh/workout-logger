# Setting Up AI Features (Gemini API)

## 🚀 Enable AI-Powered Workout Generation

Your gym app supports AI-powered workout plan generation and personalized insights using Google's Gemini AI. Here's how to set it up:

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key for your project
5. Copy the API key (starts with `AIza...`)

### 2. Add to Digital Ocean Environment Variables

1. Go to your Digital Ocean App dashboard
2. Navigate to Settings → App-Level Environment Variables
3. Add a new environment variable:
   ```
   VITE_GEMINI_API_KEY = your_api_key_here
   ```
4. Save changes (this will trigger a new deployment)

### 3. For Local Development

Add to your `.env.local` file:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

## ✨ What AI Features Provide:

- **Smart Workout Plans**: Generate custom workout plans based on user goals
- **Personalized Insights**: AI coach provides workout recommendations
- **Progress Analysis**: Intelligent analysis of workout performance
- **Form Recommendations**: AI-powered technique suggestions

## 🔧 Cost Information:

- Gemini API has a generous free tier
- Perfect for personal use and small applications
- Scales affordably as your user base grows

## 🛡️ Privacy & Security:

- Your API key is stored securely in environment variables
- No workout data is stored by Google
- All AI analysis happens in real-time

Once configured, users will see AI-powered features throughout the app!
