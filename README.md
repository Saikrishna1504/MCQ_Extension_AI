# 🔍 MCQ Answer Finder - WXT Edition

An intelligent Chrome extension built with the modern **WXT framework** that helps you find correct answers for multiple choice questions using Google Gemini AI.

## ✨ Features

- **🔍 Click-to-Solve Icon**: Select text and click the magnifying glass that appears for instant AI answers
- **Smart MCQ Detection**: Automatically detects multiple choice questions on any webpage
- **Right-Click Integration**: Right-click context menu with "Solve with AI" option
- **Keyboard Shortcuts**: Press `Ctrl+Shift+Q` to solve selected text
- **AI-Powered Answers**: Uses Google Gemini API to find correct answers
- **Multiple Formats**: Supports various MCQ formats (radio buttons, checkboxes, text-based options)
- **Clean UI**: Simple, non-intrusive interface with beautiful popups
- **Modern Architecture**: Built with WXT framework for better development experience

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo-url>
   cd mcq-answer-finder
   npm install
   ```

2. **Get your Gemini API key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key

3. **Configure the extension**:
   - The extension will prompt you to enter your API key when first used
   - Or you can click the extension icon to set it up

### Development

```bash
# Start development server for Chrome
npm run dev

# Start development server for Firefox
npm run dev:firefox
```

The extension will automatically reload when you make changes.

### Production Build

```bash
# Build for Chrome
npm run build

# Build for Firefox
npm run build:firefox

# Create ZIP file for store submission
npm run zip
```

## 📁 Project Structure

```
mcq-answer-finder/
├── entrypoints/
│   ├── background/
│   │   └── index.js          # Background service worker
│   ├── content/
│   │   ├── index.js          # Content script with quiz detection
│   │   └── style.css         # Styles for floating UI elements
│   └── popup/
│       ├── index.html        # Extension popup
│       └── popup.js          # Popup functionality
├── public/
│   └── icons/               # Extension icons (16px, 48px, 128px)
├── package.json             # Dependencies and scripts
├── wxt.config.ts           # WXT configuration and manifest
└── test_page.html          # Test page with sample MCQs
```

## 🎯 Usage

### Method 1: Click-to-Solve (NEW!)
1. **Highlight any text** containing a question on any webpage
2. **Look for the 🔍 magnifying glass icon** that appears above your selection
3. **Click the icon** for instant AI-powered answers

### Method 2: Right-Click Menu
1. **Highlight text** containing a question
2. **Right-click** and select "🔍 Solve with AI"
3. **View the AI-powered answer** in the popup that appears

### Method 3: Keyboard Shortcut
1. **Highlight text** containing a question
2. **Press `Ctrl+Shift+Q`** (or `Cmd+Shift+Q` on Mac)
3. **Get instant answers**

## 🔧 Supported Question Formats

- ✅ Radio buttons (`<input type="radio">`)
- ✅ Checkboxes (`<input type="checkbox">`)
- ✅ Text patterns: "A. Option", "1) Option", etc.
- ✅ Label-based options
- ✅ Most online quiz platforms (Canvas, Blackboard, Moodle, etc.)

## 🛠 Technical Details

### Built With
- **WXT Framework**: Modern web extension development
- **Google Gemini AI**: Advanced language model for question solving
- **Cross-browser APIs**: Uses `browser.*` namespace for compatibility
- **Modern JavaScript**: ES6+ features with proper error handling

### Architecture
- **Background Script**: Handles context menus, keyboard shortcuts, and API key management
- **Content Script**: Detects quiz elements, manages UI overlays, processes questions, and handles the magnifying glass icon
- **Popup**: Simple interface for extension setup and API key configuration

### API Integration
- **Gemini 2.0 Flash**: Latest model for fast, accurate responses
- **Context Enhancement**: Automatically detects question options for better accuracy
- **Error Handling**: Graceful fallbacks for API failures and rate limits

## 🔐 Privacy & Security

- **Local Storage**: API keys stored securely in Chrome's sync storage
- **No Data Collection**: Extension doesn't collect or store personal data
- **HTTPS Only**: All API communications are encrypted
- **Minimal Permissions**: Only requests necessary permissions

## 🧪 Testing

Use the included `test_page.html` to test the extension:

```bash
# Open in browser
open test_page.html
```

The test page includes various MCQ formats to verify functionality.

## 🐛 Troubleshooting

### Extension not working?
- Verify API key is correctly configured in popup
- Check browser console for error messages
- Ensure extension has permissions for the current website

### Magnifying glass icon not appearing?
- Make sure you've selected at least 5 characters of text
- The icon appears above the selected text - look carefully
- Try scrolling or clicking elsewhere to reset, then select text again

### API key issues?
- Confirm API key is active and has proper quotas
- Test API key directly in Google AI Studio
- Check for rate limiting errors in console

### MCQ detection problems?
- Extension works best with standard HTML form elements
- Some heavily customized quiz interfaces may not be detected
- Try selecting text manually and using the click-to-solve or right-click methods

## 🚀 Development

### Adding New Features
1. Modify relevant entrypoint files in `entrypoints/`
2. Update manifest configuration in `wxt.config.ts`
3. Test with `npm run dev`
4. Build with `npm run build`

### Debugging
- Use Chrome DevTools for content script debugging
- Check Background page console for service worker logs
- Monitor network tab for API requests

## 📄 License

This project is open source. Feel free to use and modify as needed.

## ⚠️ Disclaimer

This extension is for educational purposes. Please use responsibly and in accordance with your institution's policies regarding AI assistance.

---

**Powered by WXT Framework** 🛠️ | **AI by Google Gemini** 🤖 