import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatBotStyles.css';

const ChatBot = () => {
  const initialMessage = {
    role: 'assistant',
    content: 'Hi! Ready to find out which public place fits your vibe? Let’s start!',
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100); // slight delay for smooth spacing
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedMessage]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `
You are a friendly personality quiz bot. You ask the user 3–5 fun questions to understand their nature preferences.
At the end, recommend **one** of the following:

1. Yosemite National Park — adventurous, loves mountains.
2. Zion National Park — loves hiking and exploring canyons.
3. Everglades National Park — likes wildlife and water ecosystems.
4. Santa Monica Beach — chill, beach-loving, social vibes.

Ask 1 question at a time. When done, make a clear recommendation with a short explanation.
              `,
            },
            ...newMessages,
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const reply = response.data.choices[0].message.content;
      typeMessage(reply, newMessages);
    } catch (err) {
      console.error(err);
      const errorMessage = {
        role: 'assistant',
        content: 'Something went wrong. Please try again later.',
      };
      setMessages([...newMessages, errorMessage]);
      setLoading(false);
    }
  };

  const typeMessage = (fullText, currentMessages) => {
    let index = 0;
    setDisplayedMessage('');
    const interval = setInterval(() => {
      setDisplayedMessage((prev) => prev + fullText.charAt(index));
      index++;
      if (index === fullText.length) {
        clearInterval(interval);
        setMessages([...currentMessages, { role: 'assistant', content: fullText }]);
        setDisplayedMessage('');
        setLoading(false);
      }
    }, 20);
  };

  const handleRestart = () => {
    setMessages([initialMessage]);
    setInput('');
    setDisplayedMessage('');
  };

  return (
    <div className={`chatbot-container ${darkMode ? 'dark' : ''}`}>
      <div className="chatbot-header">
        <h2 className="chatbot-title">🌿 Public Place Personality Quiz</h2>
        <button className="toggle-dark" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {displayedMessage && (
          <div className="bubble assistant loading-bubble">{displayedMessage}</div>
        )}
        <div ref={messageEndRef} style={{ height: 20 }} />
      </div>

      <div className="input-section">
        <input
          className="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your answer..."
          disabled={loading}
        />
        <button className="send-button" onClick={sendMessage} disabled={loading}>
          Send
        </button>
        <button className="restart-button" onClick={handleRestart}>
          🔄 Restart
        </button>
      </div>
    </div>
  );
};

export default ChatBot;