# DrishtiAI 👁 — AI Navigation App for the Visually Impaired

> **"Your AI eyes for a safer, more independent world"**

A production-ready React Native (Expo) mobile app that helps visually impaired users navigate safely using real-time AI obstacle detection, voice guidance, and emergency SOS.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 AI Obstacle Detection | Real-time camera scan — detects people, vehicles, stairs, drains. TTS + haptic alerts |
| 🗺️ Voice Navigation | Turn-by-turn GPS directions with TTS. Voice-only mode. Accessible routes |
| 🆘 Emergency SOS | 5-second countdown → Firebase alert with live location to emergency contacts |
| 🎤 Voice Commands | Say "SOS", "Navigate", "Camera", "Stop" — full hands-free control |
| 🌐 Hindi/English | Full bilingual UI and TTS |
| 🌑 High Contrast | Dark theme with high-contrast accessibility mode |
| 📴 Offline Mode | Cached routes & demo detection work without internet |

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd DristiAI
npm install
```

### 2. Configure Firebase (Optional — Demo mode works without it)
Create a project at [console.firebase.google.com](https://console.firebase.google.com), then edit:
```
src/config/firebase.js
```
Replace the placeholder values with your actual Firebase config.

### 3. Run the App
```bash
npx expo start
```
Then:
- **Android emulator**: Press `a`
- **iOS simulator**: Press `i`  
- **Physical phone**: Scan the QR code with Expo Go

### 4. Demo Mode
On the Auth screen, tap **"Try Demo Mode"** — no Firebase needed. All features work immediately.

---

## 📱 App Screens

### Home / Dashboard
- Personalized greeting + TTS welcome
- 3 large accessible buttons: Start Navigation, Obstacle Detection, Settings
- Giant SOS button

### Camera / Obstacle Detection
- Live camera feed with bounding box AR overlays
- Color-coded: 🟢 Safe · 🟡 Warning · 🔴 Danger
- Voice alerts: *"Person detected, 2 meters ahead"*
- Haptic feedback patterns for each severity

### Navigation
- Dark-themed Google Maps with accessible route polyline
- Step-by-step TTS directions
- Voice-only mode (no visual map)
- Accessible routes toggle (avoids construction)

### Emergency SOS
- 5-second countdown with cancel option
- Sends location to Firebase Firestore
- Notifies all emergency contacts
- Shows confirmation with alert ID

### Settings
- Voice speed (Slow / Normal / Fast)
- Alert sensitivity (Low / Medium / High)
- Language toggle (English ⇄ हिंदी)
- Haptic feedback toggle
- High contrast mode
- Emergency contacts CRUD
- Sign out

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project called `drishti-ai`
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** → Start in test mode
5. Copy your config values into `src/config/firebase.js`

### Firestore Collections Created
- `sos_alerts` — Each SOS event (location, contacts, timestamp, status)

---

## 🛠️ Project Structure

```
DristiAI/
├── App.js                    # Root component
├── app.json                  # Expo config (permissions, icons)
├── babel.config.js           # Babel with reanimated plugin
├── src/
│   ├── config/
│   │   ├── firebase.js       # Firebase init
│   │   └── theme.js          # Design tokens (colors, spacing, fonts)
│   ├── context/
│   │   └── AppContext.js     # Global state (user, settings, contacts)
│   ├── hooks/
│   │   ├── useTTS.js         # Text-to-Speech wrapper
│   │   ├── useHaptics.js     # Haptic feedback patterns
│   │   ├── useLocation.js    # GPS location tracking
│   │   ├── useObstacleDetection.js  # ML obstacle detection + demo mode
│   │   └── useVoiceCommands.js      # Voice command processing (en/hi)
│   ├── i18n/
│   │   ├── en.js             # English strings
│   │   ├── hi.js             # Hindi (हिंदी) strings
│   │   └── index.js          # i18next setup
│   ├── navigation/
│   │   └── AppNavigator.js   # React Navigation stack
│   ├── screens/
│   │   ├── SplashScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── AuthScreen.js
│   │   ├── HomeScreen.js
│   │   ├── CameraScreen.js
│   │   ├── NavigationScreen.js
│   │   ├── SOSScreen.js
│   │   └── SettingsScreen.js
│   └── services/
│       └── sosService.js     # Firebase SOS alert sender
└── assets/                   # Icons, splash
```

---

## 📦 Deploy to Expo Preview

### One-Command Deploy
```bash
# Windows
.\deploy.ps1

# Mac/Linux  
chmod +x deploy.sh && ./deploy.sh
```

### Manual Steps
```bash
# Install Expo CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Initialize EAS
eas build:configure

# Build Android APK preview
eas build --platform android --profile preview

# Or iOS simulator build
eas build --platform ios --profile simulator
```

---

## 🧪 Testing Demo Mode

The app includes a complete demo mode:

1. Launch app → tap **"Try Demo Mode"** on Auth screen
2. **Home**: Hear TTS greeting, see demo user badge
3. **Obstacle Detection**: Tap button → detections cycle every 2.5 seconds
   - Person at 2.5m → 🔴 DANGER + haptic + TTS alert
   - Bicycle at 3.8m → 🟡 WARNING
   - Car at 6m → 🟢 SAFE
4. **Navigation**: Type any destination → demo route appears on map
5. **SOS**: Starts countdown → sends demo alert to Firestore
6. **Settings**: Toggle Hindi → all text switches to हिंदी

---

## 🔑 Dependencies

| Package | Purpose |
|---|---|
| `expo` | Expo SDK |
| `@react-navigation/native` | Navigation |
| `expo-camera` | Camera access for obstacle detection |
| `expo-speech` | Text-to-Speech |
| `expo-haptics` | Haptic feedback |
| `expo-location` | GPS tracking |
| `react-native-maps` | Map display |
| `firebase` | Auth & Firestore |
| `i18next` | Internationalization |
| `@react-native-async-storage/async-storage` | Settings persistence |
| `expo-linear-gradient` | UI gradients |

---

## ♿ Accessibility

- All interactive elements have `accessibilityLabel` and `accessibilityRole`
- Compatible with VoiceOver (iOS) and TalkBack (Android)
- Large tap targets (minimum 44×44pt)
- High contrast color mode
- Voice-only navigation mode (no visual required)
- TTS announces all state changes

---

## 📄 License
MIT — Free to use and extend.
