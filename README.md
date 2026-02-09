# 🔍 MCQ Help Buddy - Chrome Extension

A professional Chrome extension powered by Google's Gemini AI that helps you solve multiple-choice questions with detailed explanations. It features a clean, modern interface with a focus on user experience and provides instant AI-powered assistance for your MCQs.

## 🌟 Features

- **🎯 MCQ-Optimized** - Specifically designed for multiple-choice questions
- **⚡ Instant Answers** - Get AI-powered solutions in seconds
- **🎨 Modern UI** - Clean, accessible interface with smooth animations
- **🔑 API Key Management** - Easy setup and management of your API key
- **⌨️ Keyboard Shortcuts** - Quick access with Ctrl+Shift+S
- **🔄 Auto-Reload Support** - Handles extension updates gracefully
- **🛡️ Robust Error Handling** - Clear error messages and recovery

## 🚀 Installation

1. **Download or Clone** this repository
2. **Build the extension:**
   ```bash
   npm install
   npm run build
   ```
3. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `.output/chrome-mv3/` folder

## ⚡ Quick Setup

1. **Get API Key**: Get your free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Configure Extension**: Click the extension icon and enter your API key
3. **Start Solving**: Select any question text and click the 🔍 icon!

## 📖 Usage

### **Method 1: Magnifying Glass Icon (Recommended)**
1. **Select question text** on any webpage
2. **Click the 🔍 magnifying glass** icon that appears above the selection
3. **Dialog opens automatically** and sends to AI
4. **View the answer** in the response section

### **Method 2: Keyboard Shortcut**
1. **Select question text** (or enable Full Page Selection mode)
2. Press **Ctrl+Shift+S** (or **Command+Shift+S** on Mac)
3. **Dialog opens** with auto-send functionality

## 🔑 API Key Management

The extension popup provides full API key management:

- **Save API Key** - Enter and save your Gemini API key
- **Test Connection** - Verify your API key before saving
- **Change API Key** - Update your API key anytime
- **Remove API Key** - Clear your stored API key

No need to reinstall the extension to change your API key!

## 🛠️ Development

### **Build Commands**
```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Build for Firefox
npm run build:firefox
```

### **Project Structure**
```
├── entrypoints/
│   ├── background/         # Background script (keyboard shortcuts, API access)
│   ├── content/           # Content script & styles (main functionality)
│   ├── popup/             # Extension popup (API key management)
│   └── shared/            # Shared modules (config, utils, API, UI)
├── public/                # Static assets (icons)
└── .output/chrome-mv3/    # Built extension
```

## 🔧 Configuration

### **Supported Platforms**
- **GeeksforGeeks** - Quiz and coding questions
- **Canvas LMS** - Educational assessments
- **Moodle** - Course quizzes
- **Coursera** - Course materials
- **Any website** with selectable text

### **AI Model**
- **Google Gemini 2.0 Flash** - Latest high-performance model
- **Optimized prompting** for multiple-choice questions
- **Context-aware** question enhancement with automatic option detection

## 🎯 Version: 2.0.0

**Production-ready extension with clean, professional interface and robust functionality.**

---

**Note**: This extension requires a valid Google Gemini API key to function. Get yours free at [Google AI Studio](https://makersuite.google.com/app/apikey).
