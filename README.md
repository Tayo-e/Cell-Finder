<<<<<<< HEAD
# CellFinder — Harvesters Church

A mobile-first web app that helps members find their nearest fellowship cell and get directions.

---

## ⚡ Quick Start (5 steps)

### Step 1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → Name it `harvesters-cellfinder`
3. Disable Google Analytics (not needed) → Create project

### Step 2 — Enable Email/Password authentication

1. In Firebase Console → **Build → Authentication**
2. Click **Get Started**
3. Under **Sign-in providers** → Click **Email/Password**
4. Toggle **Enable** → Save

### Step 3 — Create Firestore database

1. In Firebase Console → **Build → Firestore Database**
2. Click **Create database**
3. Select **Start in production mode** → Choose a region (e.g. `europe-west1`) → Enable
4. Go to **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cells/{cellId} {
      allow read: if request.auth != null;
      allow write: if false; // only via admin SDK or seeder
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Click **Publish**

### Step 4 — Add your Firebase config to .env

1. In Firebase Console → ⚙️ **Project Settings → General**
2. Scroll down to **Your apps** → Click **</>** (Web)
3. Register app → Copy the config values
4. Open `.env` in this project and paste:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=harvesters-cellfinder.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=harvesters-cellfinder
VITE_FIREBASE_STORAGE_BUCKET=harvesters-cellfinder.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123
```

### Step 5 — Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🌱 Seed the Database

On first launch, sign up → you'll see a **"Seed Database"** button if no cells exist yet.  
Click it once — it will load 6 dummy Harvesters cells into Firestore.

When you're ready to add real cell data, edit `src/firebase/firestore.js` → `SEED_CELLS` array.

---

## 📁 Project Structure

```
src/
├── firebase/
│   ├── config.js       ← Firebase init
│   └── firestore.js    ← DB queries + seed data
├── pages/
│   ├── Login.jsx       ← Sign in screen
│   ├── Signup.jsx      ← Registration screen
│   └── Dashboard.jsx   ← Main app (find cell + directions)
├── components/
│   └── CellCard.jsx    ← Cell result card
├── utils/
│   └── distance.js     ← GPS math + Google Maps link
└── App.jsx             ← Auth router
```

---

## 🚀 Deploy to Production

```bash
npm run build
```

Then deploy the `dist/` folder to:
- **Firebase Hosting** (recommended — same platform): `firebase deploy`
- **Vercel**: connect GitHub repo, auto-deploys on push
- **Netlify**: drag & drop `dist/` folder

---

## 📱 Share with Members

After deploying, share the link in your church WhatsApp group.  
It works in any browser — no app download needed.
=======
# Cell-Finder
Cell Finder for Harvesters
>>>>>>> 0e009757f024edc44ea41be3bbb2457372d8073c
