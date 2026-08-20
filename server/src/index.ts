import express from 'express';
import cors from 'cors';
import { CONFIG } from './config/env.js';
import { AgentOrchestrator } from './agents/orchestrator.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Docent-in-Hand Multi-Agent Backend',
    model: CONFIG.GEMINI_MODEL,
    hasApiKey: Boolean(CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY.length > 5)
  });
});

// SSE Endpoint for 2-Layer Agent Docent Story Generation
app.post('/api/agent/stream-story', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { poiName, characterId, userQuery, coordinates } = req.body;
  if (!poiName || !characterId) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'poiName and characterId are required' })}\n\n`);
    res.end();
    return;
  }

  await AgentOrchestrator.orchestrateStoryStream({ poiName, characterId, userQuery, coordinates }, res);
});

// SSE Endpoint for 2-Layer Agent Interactive Chat
app.post('/api/agent/stream-chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { poiName, characterId, userMessage, history } = req.body;
  if (!poiName || !characterId || !userMessage) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'poiName, characterId, and userMessage are required' })}\n\n`);
    res.end();
    return;
  }

  await AgentOrchestrator.orchestrateChatStream({ poiName, characterId, userMessage, history }, res);
});

app.listen(CONFIG.PORT, () => {
  console.log(`🚀 [Docent Backend] Multi-Agent Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`🤖 Model: ${CONFIG.GEMINI_MODEL} | API Key configured: ${Boolean(CONFIG.GEMINI_API_KEY)}`);
});
