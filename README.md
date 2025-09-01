# 🔍 MCQ Help Buddy - Chrome Extension

A professional Chrome extension powered by Google's Gemini AI that helps you solve multiple-choice questions with detailed explanations. It features a clean, modern interface with a focus on user experience and provides instant AI-powered assistance for your MCQs.

## 🌟 What's New in v2.0.0

- **🎨 Completely Redesigned UI** - Fresh, modern interface with improved usability
- **⚡ Better Performance** - Faster response times and smoother animations
- **🛡️ Enhanced Error Handling** - More robust error recovery and user feedback
- **🔄 Auto-Reload Support** - Content script automatically reloads when needed
- **💅 Polished Design** - New styling with better accessibility and visual feedback

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

### **Method 1: Clean Dialog Interface (Recommended)**
1. **Select question text** on any webpage
2. **Click the 🔍 magnifying glass** icon that appears
3. **Dialog opens automatically** and sends to AI
4. **View the answer** in the response section
5. **Drag/resize** dialog as needed

### **Method 2: Right-Click Menu**
1. **Select question text**
2. **Right-click** → "Solve with AI 🔍"
3. **Clean dialog opens** with auto-send functionality

## 🛠️ Development

### **Build Commands**
```bash
# Development build with hot reload
npm run dev

# Production build
npm run build

# Type checking
npm run type-check
```

### **Project Structure**
```
├── entrypoints/
│   ├── background/         # Background script
│   ├── content/           # Content script & styles
│   └── popup/             # Extension popup
├── public/                # Static assets
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
- **Context-aware** question enhancement

## 🎯 Version: 2.0.0

**Production-ready extension with clean, professional interface and robust functionality.**

---

**Note**: This extension requires a valid Google Gemini API key to function. Get yours free at [Google AI Studio](https://makersuite.google.com/app/apikey). 
