# Local Business CRM 🚀

An AI-powered Customer Relationship Management (CRM) platform designed specifically for local businesses, vendors, and small enterprises.

This project helps businesses manage customers, leads, reminders, marketing activities, and business insights through a modern dashboard integrated with AI-powered assistance.

---

# 🌟 Overview

Many local businesses still manage customers and leads manually using notebooks, spreadsheets, or WhatsApp chats. Existing enterprise CRM platforms are often expensive, complex, and overloaded with features that small businesses do not need.

**Local Business CRM** solves this problem by providing:

* A simple and affordable CRM solution
* AI-powered business assistance
* Customer and lead management
* Marketing and reminder tools
* Smart insights for business growth
* A clean and user-friendly dashboard

---

# ✨ Key Features

## 🔐 Authentication System

* Secure user signup and login
* Firebase Authentication integration
* Protected routes and sessions

## 📊 Smart Dashboard

* Business overview analytics
* Lead and customer statistics
* Activity tracking
* Business performance insights

## 👥 Customer Management

* Add, edit, and manage customers
* Store customer details securely
* Customer relationship tracking
* Organized customer database

## 📌 Lead Management

* Track business leads
* Monitor lead status
* Improve customer conversion workflow
* Business opportunity management

## ⏰ Reminder System

* Create smart reminders
* Schedule follow-ups
* Manage daily business tasks
* Improve customer engagement consistency

## 📢 Marketing Tools

* Campaign planning features
* AI-powered marketing suggestions
* Engagement tracking
* Business promotion assistance

## 🤖 AI-Powered Features

* BizMind AI Assistant
* Smart business recommendations
* AI-generated insights
* Voice assistant support
* Predictive business analysis

## 🌍 Multi-language Support

* Translation support integrated
* User-friendly multilingual experience

## ⚙️ User Settings & Profile

* Profile management
* Application customization
* Settings management

---

# 🛠️ Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

## Backend & Database

* Firebase Firestore
* Firebase Authentication

## AI Integration

* OpenAI API

## Other Tools

* Context API
* Modular component architecture

---

# 📂 Project Structure

```bash
src/
 ├── components/
 │    ├── BizMindAssistant.tsx
 │    ├── Layout.tsx
 │    ├── PredictionsModal.tsx
 │    ├── SettingsModal.tsx
 │    └── VoiceModal.tsx
 │
 ├── context/
 │    └── SettingsContext.tsx
 │
 ├── lib/
 │    ├── firebase.ts
 │    ├── translations.ts
 │    ├── errorHandler.ts
 │    └── utils.ts
 │
 ├── pages/
 │    ├── Dashboard.tsx
 │    ├── Customers.tsx
 │    ├── Leads.tsx
 │    ├── Marketing.tsx
 │    ├── Reminders.tsx
 │    ├── Profile.tsx
 │    ├── Login.tsx
 │    └── Signup.tsx
 │
 ├── App.tsx
 └── main.tsx
```

---

# ⚡ Getting Started

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/shamitha-06/Local-Business-CRM.git
```

---

## 2️⃣ Navigate to Project Folder

```bash
cd Local-Business-CRM
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

---

## 4️⃣ Configure Environment Variables

Create a `.env` file in the root directory.

Example configuration:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
OPENAI_API_KEY=your_openai_api_key
```

⚠️ Never upload your `.env` file to GitHub.

---

# ▶️ Run the Application

```bash
npm run dev
```

The application will run locally at:

```bash
http://localhost:5173
```

---

# 🔥 Firebase Setup

1. Create a Firebase Project
2. Enable Firebase Authentication
3. Enable Firestore Database
4. Configure Firestore Rules
5. Copy Firebase credentials into `.env`

---

# 📦 Build for Production

```bash
npm run build
```

---

# 🚀 Future Enhancements

* Vendor management module
* Voice-based CRM automation model
* Invoice and billing system
* Mobile application

---

# 🔒 Security

This project follows secure development practices:

* Firebase Authentication security
* Firestore database rules
* Protected environment variables
* API key security using `.env`
* Modular and maintainable architecture

---

# 🎯 Target Users

This CRM platform is designed for:

* Local businesses
* Small shops
* Startups
* Vendors
* Service providers
* Small business owners

---
