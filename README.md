# ⚡ LeetCode Stalker (v2.0)

A modern full-stack application that tracks LeetCode profiles in real-time and delivers instant **Telegram notifications** with problem names, difficulty badges (🟢 Easy / 🟡 Medium / 🔴 Hard), and links whenever a tracked user submits an accepted solution.

Built with a **Production Node.js Backend** and a sleek **React Native Android Application** (Dark Cyberpunk Glassmorphism UI).

---

## 📱 Project Structure

```
Stalker/
├── backend/                       # Production Node.js & Express REST Backend
│   ├── src/
│   │   ├── config/env.js          # Environment parser & validation
│   │   ├── services/
│   │   │   ├── leetcodeService.js # Official LeetCode GraphQL queries & diffing
│   │   │   ├── telegramService.js # Telegram Bot dispatcher & HTML formatting
│   │   │   ├── trackerService.js  # Background scheduler & polling engine
│   │   │   └── storageService.js  # Safe atomic JSON persistence
│   │   ├── controllers/           # Route controllers (Targets, Telegram, Settings)
│   │   ├── routes/api.js          # Express REST API
│   │   └── server.js              # Server entry point
│   ├── .env.example               # Environment variables template
│   ├── .env                       # Local secrets (Bot Token & Chat ID)
│   ├── Dockerfile                 # Container deployment
│   ├── render.yaml                # 1-Click Render Cloud deployment
│   └── package.json
│
├── mobile/                        # React Native Android Mobile App (Expo)
│   ├── src/
│   │   ├── api/client.js          # REST Client with dynamic host switching
│   │   ├── components/            # TargetCard, StatPill, SubmissionCard, PreviewModal
│   │   ├── screens/               # HomeScreen, AddTargetScreen, SubmissionsScreen, SettingsScreen
│   │   ├── theme/colors.js        # Modern dark cyberpunk color system
│   │   └── utils/helpers.js       # URL parsers, timeago & difficulty formatters
│   ├── App.js                     # Root Tab Navigator
│   ├── app.json                   # Expo Android build configuration
│   └── package.json
│
└── README.md
```

---

## 🤖 1. Setting Up Telegram Bot Credentials

### Step 1: Create Your Telegram Bot
1. Open the Telegram app and search for [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts to choose a name and username for your bot.
3. BotFather will provide an **API Token** formatted like:
   `7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`
4. Copy this token.

### Step 2: Get Your Telegram Chat ID
1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram and send `/start`.
2. It will reply with your **Id** (e.g. `6344734804`).
3. *(Alternative)*: Search for your newly created bot in Telegram and press `/start`, then run `/myid`.

### Step 3: Configure `.env` in Backend
Open [backend/.env](file:///c:/Users/kusha/Desktop/stalker/Stalker/backend/.env) and insert your credentials:

```env
PORT=5000
TELEGRAM_BOT_TOKEN=7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_DEFAULT_CHAT_ID=XXXXXXXXX
POLL_INTERVAL_SECONDS=60
DATA_FILE_PATH=./data/stalker_data.json
ENABLE_TELEGRAM_POLLING=true
```

---

## 🚀 2. Running the Backend (Node.js)

```bash
# Navigate to backend
cd backend

# Install dependencies (if not already installed)
npm install

# Start development server with auto-reload
npm run dev

# Or start in production mode
npm start
```

- Server will start at: `http://localhost:5000`
- Test Health API: `http://localhost:5000/api/health`

---

## 📱 3. Running the React Native Android App

```bash
# Navigate to mobile app directory
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npm start
```

### Running on Android:
- **Android Device**: Install **Expo Go** from Google Play Store, connect your phone to the same Wi-Fi network, and scan the QR code displayed in the terminal.
- **Android Emulator**: Press `a` in the terminal to launch on the running Android Emulator.
- In the mobile app's **Settings tab**:
  - If using Android Emulator: set Backend URL to `http://10.0.2.2:5000`
  - If using Physical Android Device on same Wi-Fi: set Backend URL to `http://<YOUR_PC_LOCAL_IP>:5000` (e.g. `http://192.168.1.50:5000`)
  - If backend is hosted on Cloud (e.g. Render): set Backend URL to `https://your-stalker-backend.onrender.com`

---


## 💡 Telegram Bot Commands

When your backend is running, you can also interact with your bot directly inside Telegram:
- `/start` or `/help` - Show bot menu & Chat ID
- `/register <username_or_url>` - Start tracking a LeetCode user
- `/unregister <username>` - Stop tracking a user
- `/list` - List all currently tracked profiles
- `/stats <username>` - View latest solved counts
- `/checknow` - Force instant background poll
- `/myid` - Show your Telegram Chat ID
