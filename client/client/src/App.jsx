import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const chatEndRef = useRef(null);

  const API_URL = 'https://dsabot-new.vercel.app'; // 🔥 Hardcoded API URL

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setChat(prev => [...prev, userMessage]);
    setInput('');

    try {
      const res = await axios.post(`${API_URL}/chat`, { message: input });
      const botMessage = { sender: 'bot', text: res.data.reply };
      setChat(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setChat(prev => [...prev, { sender: 'bot', text: '❌ Error from API. Please try again.' }]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const CodeBlock = ({ className, children }) => {
    const language = /language-(\w+)/.exec(className || '')?.[1] || 'text';

    const copyToClipboard = () => {
      navigator.clipboard.writeText(children);
    };

    return (
      <div className="code-block">
        <button className="copy-btn" onClick={copyToClipboard}>Copy</button>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  };

  return (
    <div className="app">
      <div className="chatbox">
        <h2 className="title">💬 Gemini DSA Chatbot</h2>
        <div className="chat-window">
          {chat.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.sender}`}>
              <div className="sender-label">
                {msg.sender === 'user' ? '👤 You' : '🤖 Bot'}
              </div>
              {msg.sender === 'bot' ? (
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return inline ? (
                        <code className={className} {...props}>{children}</code>
                      ) : (
                        <CodeBlock className={className} children={children} />
                      );
                    }
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                <div>{msg.text}</div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="input-box">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a DSA question..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
