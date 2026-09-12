# 🏙️ CleanCity AI — Smart Municipal Civic Issue & Proof-of-Work Verification System

A full-stack, enterprise-grade municipal infrastructure management and civic reporting platform. CleanCity AI empowers citizens to report neighborhood issues (garbage, drainage, potholes, streetlights) with real-time GPS tracking and enables municipal administrators to dispatch field workers and verify work completion through computer vision (YOLOv8 + SSIM) and GPS sensor proof.

---

## 🌟 Key Features

### 👤 Citizen Portal
- **Zero-Friction Reporting**: Intuitive multi-step wizard to report civic defects with photo evidence.
- **Accurate Geolocation**: High-accuracy browser GPS capture with automated reverse-geocoding (via OpenStreetMap Nominatim) to resolve exact physical street names and editable landmarks.
- **Real-Time Tracking**: Live timeline tracking the complaint lifecycle from `Submitted` → `Assigned` → `In Progress` → `Verification` → `Resolved`.

### 👷 Worker Operations Console
- **Worker Dispatch Switcher**: Clean identity presentation for field workers (e.g. Ramesh Shinde, Suresh Kumar, Amit Patel) without cluttered department descriptions.
- **Dual Photo Proof Protocol**:
  - **Arrival/Before Photo**: Captures initial defect condition upon arrival on site.
  - **Completion/After Photo**: Captures restored, cleaned site evidence.
- **Ultra-Fast Uploads**: Client-side canvas compression reduces image uploads to <100ms.
- **On-Site GPS Proximity Validation**: Real-time GPS coordinate capture and distance calculation relative to the citizen's reported incident.

### 🛡️ Municipal Admin Dashboard & AI Verification Center
- **Live GIS Map**: Interactive Leaflet map displaying real-time civic incidents, priority markers, and worker locations.
- **Worker Dispatch Management**: One-click assignment of pending complaints to on-duty municipal workers.
- **Proof-of-Work AI Inspector**: Side-by-side comparison of citizen defect (Before) vs worker resolution (After).
- **Automated AI Vision Verification**: Integrated YOLOv8 object detection and SSIM structural similarity comparison to confirm defect resolution.
- **Optimistic Decision Engine**: Instant admin approval or rejection with automatic worker notification for re-work.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Lucide Icons, Leaflet / React-Leaflet, Axios, Socket.IO Client.
- **Backend**: Node.js (ES Modules), Express, Socket.IO, Multer, Mongoose (MongoDB Atlas), Haversine Distance Service.
- **Storage**: Hybrid architecture supporting cloud MongoDB Atlas with seamless local JSON fallback (`data.json`).
- **Geocoding**: OpenStreetMap Nominatim reverse geocoding engine.

---

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- (Optional) MongoDB Atlas account or local MongoDB instance

### 2. Clone the Repository
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd smart-city-app
```

### 3. Backend Setup
```bash
cd backend
npm install

# Copy sample environment configuration
cp .env.example .env
# Configure your MONGODB_URI and JWT_SECRET in .env

# Run backend development server (Port 5000)
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install

# Run frontend development server (Port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Default Credentials & Roles

| Role | Portal URL | Login / Identifier | Notes |
| :--- | :--- | :--- | :--- |
| **Citizen** | `/citizen` | `citizen@cleancity.gov` | Report complaints with GPS |
| **Admin** | `/admin` | `admin@cleancity.gov` | Verification Center & Dispatch |
| **Worker (Ramesh)** | `/workers` | `WRK-201` | Field work orders & camera proof |
| **Worker (Suresh)** | `/workers` | `WRK-202` | Field work orders & camera proof |
| **Worker (Amit)** | `/workers` | `WRK-203` | Field work orders & camera proof |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
