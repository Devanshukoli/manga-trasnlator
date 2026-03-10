import React from 'react';

function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#ff4757' }}>📖 Manga Translator (Left-to-Right) Dashboard</h1>
      <p>Your backend translation server is configured to evaluate manga bubbles left-to-right as requested.</p>
      
      <div style={{ background: '#f1f2f6', padding: '20px', borderRadius: '8px', marginTop: '30px' }}>
        <h2>System Status</h2>
        <ul style={{ lineHeight: '2' }}>
          <li>🟢 <strong>Backend API:</strong> Ready to receive translation scans at <code>http://localhost:3000/api/translate</code></li>
          <li>🟢 <strong>Database:</strong> MongoDB hooked up.</li>
          <li>🟢 <strong>Extension:</strong> Ensure the browser extension is loaded unpacked in Chrome.</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        Check your <code>.env</code> file in the backend to make sure your <strong>Gemini</strong> and <strong>Ling.dev</strong> API keys are active.
      </div>
    </div>
  )
}

export default App;
