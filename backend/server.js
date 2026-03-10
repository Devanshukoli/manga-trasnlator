const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for image payloads

const History = require('./models/history');

// DB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/translate', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. Image OCR extraction with specific Left-to-Right direction awareness
    const ocrPrompt = `You are a Japanese manga OCR assistant. 
    IMPORTANT INSTRUCTION: The user has specified that these manga lines are read strictly from LEFT to RIGHT. 
    Sweep the text bubbles on this page from left to right, line by line. 
    Return strictly the raw Japanese text you see in that sequence without extra formatting.`;

    const imageParts = [
      {
        inlineData: {
          data: imageBase64.split(',')[1],
          mimeType: "image/jpeg"
        }
      }
    ];

    const result = await model.generateContent([ocrPrompt, ...imageParts]);
    const response = await result.response;
    const extractedJapaneseText = response.text();

    // 2. Translate text (Using lingo/ling.dev API, fallback to Gemini)
    let translatedText = "";
    try {
      const lingoResponse = await axios.post('https://api.ling.dev/v1/translate', {
        source_language: "ja",
        target_language: "en",
        text: extractedJapaneseText
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.LINGO_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      translatedText = lingoResponse.data.translation || lingoResponse.data.result;
    } catch (e) {
      console.log('Lingo API failed or unavailable, falling back to Gemini for translation...');
      const translatePrompt = `Translate the following Japanese text to English in an easy-to-read comic style string:\n\n${extractedJapaneseText}`;
      const trResult = await model.generateContent(translatePrompt);
      translatedText = trResult.response.text();
    }

    // 3. Save History in DB
    const historyItem = new History({ originalText: extractedJapaneseText, translatedText });
    await historyItem.save();

    res.json({
      success: true,
      originalText: extractedJapaneseText,
      translatedText: translatedText,
      readingDirection: "Left-to-Right"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
