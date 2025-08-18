# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "home-sheet-app")
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location closest to your users
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In your Firebase project, click the gear icon → "Project settings"
2. Scroll down to "Your apps" section
3. Click the web icon `</>` to add a web app
4. Enter an app nickname (e.g., "home-sheet-web")
5. Click "Register app"
6. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## Step 4: Update Firebase Configuration

1. Open `src/firebase.js` in your project
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Set up Firestore Security Rules (Optional)

In the Firebase Console, go to Firestore Database → Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read and write access to all documents
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note**: These rules allow anyone to read/write. For production, implement proper authentication and security rules.

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Try saving a document using the "Save" button
3. Check your Firestore database in the Firebase Console to see the saved data

## Features Available

- ✅ **Save Documents**: Save your text and parsed data to the cloud
- ✅ **Load Documents**: Retrieve previously saved documents
- ✅ **Update Documents**: Modify existing documents
- ✅ **Delete Documents**: Remove unwanted documents
- ✅ **Share Documents**: Generate shareable links
- ✅ **Auto-sync**: Real-time synchronization across devices

## Free Tier Limits

Firebase Firestore free tier includes:
- 1 GiB total storage
- 50,000 reads per day
- 20,000 writes per day
- 20,000 deletes per day

This is generous for personal projects and small applications.
