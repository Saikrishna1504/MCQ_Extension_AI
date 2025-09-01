# 🔍 MCQ Help Buddy - Chrome Extension

A professional Chrome extension powered by Google's Gemini AI that helps you solve multiple-choice questions with detailed explanations. It features a clean, modern interface with a focus on user experience and provides instant AI-powered assistance for your MCQs.

## 🌟 What's New in v2.0.0

- **🎨 Completely Redesigned UI** - Fresh, modern interface with improved usability
- **⚡ Better Performance** - Faster response times and smoother animations
- **🛡️ Enhanced Error Handling** - More robust error recovery and user feedback
- **🔄 Auto-Reload Support** - Content script automatically reloads when needed
- **💅 Polished Design** - New styling with better accessibility and visual feedback

## ✨ Features

- **🎨 Clean Dialog Interface** - Minimal white design with Google Material styling
- **🚀 Auto-Send Functionality** - Automatically sends questions to AI when dialog opens
- **✏️ Editable AI Prompts** - Customize how you want AI to respond
- **🖱️ Click-to-Solve Icon** - Magnifying glass icon appears on text selection
- **⌨️ Keyboard Shortcuts** - Quick access with `Ctrl+Shift+Q`
- **🤖 Multiple AI Interactions** - Right-click menu, icon click, and keyboard shortcuts
- **📱 Draggable & Resizable** - Move and resize dialog anywhere on screen
- **🎯 Smart Context Detection** - Automatically finds question options on the page
- **🛡️ Robust Error Handling** - User-friendly error messages and recovery

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

### **Method 3: Keyboard Shortcut**
1. **Select question text**
2. **Press `Ctrl+Shift+Q`** (Windows/Linux) or `Cmd+Shift+Q` (Mac)
3. **Dialog appears** and processes the question

## 🎨 Dialog Features

### **Clean Design**
- **Minimal white interface** inspired by Google's design
- **Subtle shadows and borders** for professional look
- **Google Material blue accents** (#4285f4)
- **Clean typography** with proper contrast

### **Interactive Elements**
- **✏️ Pencil icon** for prompt editing section
- **Separated sections** with clear visual boundaries
- **Drag handle** in header for moving dialog
- **Resize handle** in bottom-right corner
- **Close button (X)** and minimize controls

### **Smart Functionality**
- **Auto-send** - Questions sent to AI immediately
- **Custom prompts** - Edit how AI responds
- **Loading states** - Clear progress indicators
- **Error recovery** - Helpful error messages with solutions

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

## 🚨 Troubleshooting

### **Dialog Not Opening**
- Ensure you selected more than 5 characters
- Check if extension is enabled in `chrome://extensions/`
- Try refreshing the page

### **No AI Response**
- Verify API key is set in extension popup
- Check internet connection
- Look for specific error messages in dialog

### **Extension Context Errors**
- If you see "Extension was reloaded" message
- Simply refresh the page to restore functionality
- Error handling will guide you through recovery

## 📋 Current Features Summary

✅ **Clean minimal dialog** (white background, Google styling)  
✅ **Auto-send functionality** (immediate AI processing)  
✅ **Drag and resize** (smooth interactions)  
✅ **Separate sections** (prompt and response clearly divided)  
✅ **Error handling** (user-friendly recovery messages)  
✅ **Multiple interaction methods** (icon, right-click, keyboard)  
✅ **Smart context detection** (finds question options automatically)  
✅ **Professional UI** (Google Material Design inspired)  

## 🎯 Version: 2.0.0

**Production-ready extension with clean, professional interface and robust functionality.**

---

**Note**: This extension requires a valid Google Gemini API key to function. Get yours free at [Google AI Studio](https://makersuite.google.com/app/apikey). 