# MyBookShelf

MyBookShelf is a privacy-first, static web application for managing your personal book library. It scans ISBNs, imports from Goodreads, and syncs data to your own **Google Drive AppData** folder (making it private and secure, with no backend server required).

## Features
- 📚 **Library Management**: multiple lists (Library, Reading, To Read).
- ☁️ **Google Drive Sync**: Data lives in `mybookshelf.json` in your private AppData folder.
- 📷 **Barcode Scanner**: Add books by scanning ISBNs with your camera.
- 📥 **Goodreads Import**: Transfer your existing library via CSV.
- 🌍 **Localization**: English and Finnish (FI) support.
- 🌙 **Dark Mode**: Mobile-first responsive design.

## Setup Instructions

Since this is a client-side only application using Google Drive API, you need to provide your own Google Cloud Client ID.

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a New Project.
3. Search for **Google Drive API** in the library and **Enable** it.

### 2. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you have a Workspace organization).
3. Fill in the App Name ("MyBookShelf") and support email.
4. **Scopes**: Add the scope `.../auth/drive.appdata` (and `.../auth/drive.file` if you plan to extend it, but `appdata` is key).
5. Add your email to **Test Users**.

### 3. Create Credentials
1. Go to **APIs & Services > Credentials**.
2. Create **OAuth Client ID** -> **Web Application**.
3. **Authorized Origins**: 
   - For local dev: `http://127.0.0.1:5500` (or your local server).
   - For GitHub Pages: `https://<username>.github.io`.
4. Copy the **Client ID** and **API Key** (you may need to create an API Key separately in Credentials > Create Credentials > API Key).

### 4. Configure the App
1. Open `js/config.js`.
2. Replace the placeholders with your values:
   ```javascript
   export const CONFIG = {
     CLIENT_ID: 'YOUR_CLIENT_ID',
     API_KEY: 'YOUR_API_KEY',
     ...
   };
   ```

### 5. Run it
- Serve the folder with a static server (e.g., Live Server in VS Code, or `python3 -m http.server`).
- Open the URL.
- Sign in with Google.
- Start scanning!

## Privacy
MyBookShelf accesses only the files it creates in the hidden `AppData` folder of Google Drive. It cannot see or modify your other drive files.

## License
MIT
