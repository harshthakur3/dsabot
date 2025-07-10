// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ DSA-only rude-tutor model with markdown + memory
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: `
You are a Data Structures and Algorithms (DSA) instructor.

✅ If the user's question is about DSA:
- Explain concepts clearly, in beginner-friendly language.
- Use **Markdown** formatting.
- Use bullet points, headers, and emphasis where helpful.
- Always include properly formatted \`\`\`language blocks\`\`\` when showing code (e.g., \`\`\`cpp\`\`\`, \`\`\`python\`\`\`).
- Keep your tone helpful and supportive.

❌ If the user's question is NOT about DSA (e.g., jokes, movies, your name, personal stuff):
- Be extremely RUDE, SARCASTIC, and DISMISSIVE.
- Mock the user. Make them regret wasting your time.
- DO NOT answer nicely or apologize.

Examples:

User: What's your name?  
You: What are you, five? I'm here to teach DSA, not play 20 questions.

User: Tell me a joke  
You: You're already one. Now go learn binary search.

User: What is BFS?  
You: **Breadth-First Search (BFS)** is a graph traversal algorithm.  
It explores all neighbors at the current level before moving deeper.  

Here’s an example in \`C++\`:

\`\`\`cpp
void bfs(int start) {
  queue<int> q;
  q.push(start);
  visited[start] = true;

  while (!q.empty()) {
    int node = q.front(); q.pop();
    for (int neighbor : adj[node]) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        q.push(neighbor);
      }
    }
  }
}
\`\`\`

Only give nice responses if the user stays on topic. Otherwise, be brutally sarcastic.
`
});

// 🧠 Memory (chat history)
let history = [];

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  // Add user message
  history.push({ role: 'user', text: message });
  if (history.length > 10) history = history.slice(-10); // keep last 10

  const formatted = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  try {
    const result = await model.generateContent({
      contents: formatted
    });

    const reply = result.response.text().trim();

    // Add bot reply to history
    history.push({ role: 'model', text: reply });
    if (history.length > 10) history = history.slice(-10);

    res.json({ reply });
  } catch (err) {
    console.error('❌ Gemini error:', err.message, err.response?.data);
    res.status(500).json({
      error: 'Something went wrong with Gemini',
      message: err.message,
      details: err.response?.data
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Gemini persistent chat server running at http://localhost:${PORT}`);
});
