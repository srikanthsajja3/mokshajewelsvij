# MOKSHA JEWELS - Luxury Jewelry Application

A high-end, responsive jewelry application built with **React Native (Expo)**, featuring real-time gold rates, automatic country detection, and localized pricing for an international luxury experience.

## ✨ Key Features

- 🌍 **Intelligent Localization:** 
  - Automatic country detection using IP Geolocation and Browser Language.
  - Manual country selector in the header (India 🇮🇳 vs USA 🇺🇸).
  - Prices automatically convert between INR (for India) and USD (for others) using current exchange rates.

- 💰 **Live Gold Rates:**
  - Dynamic, scrolling "Marquee" ticker displaying current rates for **24K, 22K, and 18K** gold.
  - Localized units: Per 10g for India, Per Gram for USA.
  - Periodic background updates to keep rates fresh.

- 💎 **Premium Shopping Experience:**
  - **Comprehensive Sorting:** Sort collections by Popularity, Rating, Newest, Price, and Gross Weight.
  - **Technical Details:** Full breakdown of product specifications (Product Code, Gross Weight, Metal Color, Gold Weight, Purity).
  - **Transparent Pricing:** Detailed price breakup including Metal cost, VA & Making charges, Stone/Bead costs, and Taxes.
  - **Recommendations:** Smart related-product suggestions on the product details page.

- 📱 **Native Mobile Feel:**
  - **iOS Swipe-to-Back:** Smooth, native-feeling gesture navigation from left to right.
  - **Responsive Design:** Optimized layouts for Web, Tablet (iPad), and Mobile.
  - **Rich Typography:** Using premium Trajan Pro fonts for a luxurious brand feel.

## 🛠️ Project Dependencies

### Core Dependencies
- `expo`: Framework for universal React applications.
- `react` & `react-native`: For building the native UI.
- `react-native-web`: For deploying the same codebase to the web.
- `expo-localization`: For detecting user locale and language.
- `react-native-gesture-handler`: For smooth native gestures like swipe-to-back.

### Service Integrations
- `@supabase/supabase-js`: Integration with Supabase backend.
- `expo-secure-store`: For secure data storage on mobile devices.
- `react-native-url-polyfill`: For broad API compatibility.

### Full Dependency List (from package.json):
- `@expo/metro-runtime`: `~6.1.2`
- `@supabase/supabase-js`: `^2.99.2`
- `expo`: `~54.0.0`
- `expo-font`: `~14.0.11`
- `expo-localization`: `~17.0.8`
- `expo-secure-store`: `~15.0.8`
- `expo-status-bar`: `~3.0.9`
- `react`: `19.1.0`
- `react-dom`: `19.1.0`
- `react-native`: `0.81.5`
- `react-native-gesture-handler`: `~2.28.0`
- `react-native-url-polyfill`: `^3.0.0`
- `react-native-web`: `^0.21.0`

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Project:**
   - Web: `npm run web`
   - iOS: `npm run ios`
   - Android: `npm run android`

## 📁 Project Structure

- `src/components`: Reusable UI elements (Header, GoldRateBanner, etc.)
- `src/contexts`: Global state management (Country detection, Gold rates)
- `src/screens`: Main application screens (Home, Category, Product Details)
- `src/data`: Product information and metadata
- `src/utils`: Utility functions for currency formatting and calculations
- `assets`: Fonts, images, and logo assets
