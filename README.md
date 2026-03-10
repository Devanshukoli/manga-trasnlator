# Manga Translator (Left-To-Right Aware)

A monorepo stack for a browser extension that translates manga directly on the webpage using AI. 
Configured specifically to scan text bubbles from Left-to-Right.

## Stack
- **Backend:** Node.js, Express, MongoDB
- **AI Services:** Gemini 1.5 Pro/Flash (for OCR text bounding/extraction), Ling.dev / Lingo API (for translation)
- **Frontend Dashboard:** React, Vite
- **Extension:** Chrome Manifest V3 (Vanilla JS)

## Project Layout
- `/backend`: Translation logic, OCR prompt chaining, and history DB saving.
- `/frontend`: Dashboard to view connections and details.
- `/extension`: The browser extension you load into Chrome to parse pages on the fly.
