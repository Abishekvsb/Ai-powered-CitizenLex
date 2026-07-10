# 🎬 CitizenLex Walkthrough & Video Recording Guide

This guide provides a professional, step-by-step script and recording checklist to create a polished 2–3 minute project demonstration video of CitizenLex for recruiters, faculty members, and portfolio viewers.

---

## 📹 Video Specifications
* **Resolution**: 1080p Full HD (1920×1080).
* **Frame Rate**: 30 FPS or 60 FPS.
* **Aspect Ratio**: 16:9 widescreen.
* **Browser State**: Clean window (hide bookmarks bar, notifications, search bar suggestions, and extra tabs).
* **Zoom Level**: 100%.
* **Cursor**: Enable mouse click rings/highlights if your recording software supports it (e.g., OBS Studio, Camtasia, Loom, or Windows Game Bar).

---

## ⏱️ Scene-by-Scene Walkthrough (2-3 Minutes)

### 🎬 Scene 1: Intro Title Card (0:00 - 0:05)
* **Visual**: Clean dark screen with white/blue text:
  > **AI-Powered CitizenLex**
  > *Project Demonstration*
* **Tip**: Use standard video editors (like CapCut, Canva, iMovie, or Adobe Premiere) to add a 5-second fade transition.

### 🏠 Scene 2: Homepage & Cinematic Entrance (0:05 - 0:20)
* **Action**:
  1. Open [CitizenLex Live Production Site](https://ai-powered-citizen-lex.vercel.app).
  2. Click **Initialize System** (if the intro animation plays) or watch the glowing grid globe render.
  3. Scroll down smoothly to show the stats counters (`12,480+ Queries Processed`, `150+ Lawyers Available`) and the footer cards.
  4. Scroll back up to the top navbar.

### 🔐 Scene 3: Registration & Dual-Panel Auth (0:20 - 0:40)
* **Action**:
  1. Click **Register** on the top-right button.
  2. Explain/show the premium glassmorphism dual-panel UI (Login on the left, Register on the right).
  3. Fill in the Registration Form:
     * *Full Name*: `Demo User`
     * *Email*: Use a new test email, e.g., `user.demo@citizenlex.test`
     * *Mobile Number*: `9876543210`
     * *Password / Confirm*: `Password@123!`
     * *Agree to Terms*: Click check.
  4. Click **Create Account**.
  5. Accept the browser alert stating account registered successfully.

### 🔑 Scene 4: Login (0:40 - 0:50)
* **Action**:
  1. Go to the left panel ("Welcome Back").
  2. Type the registered email and password.
  3. Click **Sign In**.

### 📊 Scene 5: Command Console Dashboard (0:50 - 1:05)
* **Action**:
  1. Let the dashboard load. Point out the personalized greeting: *"Hello, Demo User"* and the system clock.
  2. Highlight the 4 metrics cards: **AI Conversations (0)**, **Documents Analyzed (0)**, **System Notifications (12)**, and **Account Status (Active)**.
  3. Hover over the **Command Console Hub** shortcuts.

### 📚 Scene 6: Rights Explorer (1:05 - 1:15)
* **Action**:
  1. Click **Rights Explorer** in the sidebar.
  2. Show how fundamental rights are neatly structured. Click on a category (e.g., *Right to Equality*) to show the animated details card slide open.

### 🏛️ Scene 7: Government Scheme Finder (1:15 - 1:25)
* **Action**:
  1. Click **Scheme Finder** in the sidebar.
  2. Show the scheme cards. Use a filter or category selector to show the instant search/filtering mechanism.

### 🤖 Scene 8: AI Legal Assistant (1:25 - 1:40)
* **Action**:
  1. Click **AI Assistant** in the sidebar.
  2. Click on one of the quick-start prompt chips (e.g., *"What are my rights if arrested?"*).
  3. Watch the Gemini-powered response stream in. Point out the bilingual language switcher (English/Tamil).

### ⚖️ Scene 9: AI Legal Copilot (1:40 - 1:55)
* **Action**:
  1. Click **Legal Copilot** in the sidebar.
  2. Explain that the Copilot is designed for complex legal queries requiring step-by-step reasoning.
  3. Type a sample scenario: `"My landlord is refusing to return my security deposit in Chennai. What steps should I take?"` and hit send.
  4. Let the Gemini-powered legal analysis construct its multi-stage response.

### 👨‍⚖️ Scene 10: Lawyer Marketplace (1:55 - 2:10)
* **Action**:
  1. Click **Find Lawyers** in the sidebar.
  2. Show the search box and the filters (District, Experience, Practice Area).
  3. Highlight the list of verified advocates. Click **View Profile** on one to show their bio, registration, ratings, and booking options.

### 🔍 Scene 11: OCR Document Scanner (2:10 - 2:25)
* **Action**:
  1. Click **OCR Scanner** in the sidebar.
  2. Click upload and select a sample image file containing text.
  3. Click **Extract Text** and watch the Tesseract.js engine parse the text on-screen.

### 📝 Scene 12: AI Legal Draft Generator (2:25 - 2:40)
* **Action**:
  1. Click **AI Drafts** in the sidebar.
  2. Select a template (e.g., *RTI Application* or *Consumer Complaint*).
  3. Watch the draft outline load, ready for AI customization.

### 👤 Scene 13: Profile Settings (2:40 - 2:50)
* **Action**:
  1. Click **Profile Settings** in the sidebar.
  2. Point out the profile photo upload widget which is fully configured to stream media to **Cloudinary CDN** (no local storage footprint).

### 🔔 Scene 14: Notifications & Logout (2:50 - 3:00)
* **Action**:
  1. Click the notification bell icon to view real-time system alerts.
  2. Click the **Logout** button.
  3. Watch the app return smoothly to the landing page.

---

## ✂️ Editing & Post-Production Checklist
1. **Remove Gaps**: Trim out page loading screens or keying delays to keep the pacing snappy.
2. **Speed Up AI Generation**: Speed up the parts where Gemini writes the chat answers by 1.5x/2x so the viewer does not have to wait.
3. **Outro Card**: Add a final screen:
   > **Thank you for watching**
   > *CitizenLex — Simplifying Justice for Everyone*
4. **Compression**: Export using H.264 codec in `.mp4` format (Target bitrate: 5–8 Mbps to keep the file size under 50MB).

---

## 🌐 Uploading & Repository Linkage
1. Upload the exported video to **YouTube** as **Unlisted** (or Public if you prefer).
2. Grab the video link (e.g., `https://youtu.be/your_video_id`).
3. Open `README.md` and modify the demo link:
   ```diff
   - > 📹 **[Watch Full Demo on YouTube →](https://youtube.com)** *(Upload your demo video and replace this link)*
   + > 📹 **[Watch Full Demo on YouTube →](https://youtu.be/your_video_id)**
   ```
