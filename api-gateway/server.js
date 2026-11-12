// API Gateway - single entry point. Every client request goes through here.
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
// Same pod as the gateway -> reachable on localhost
const REGISTRATION_URL = process.env.REGISTRATION_URL || 'http://localhost:4001';
// Different pod -> reached through the Kubernetes Service name
const STUDENT_URL = process.env.STUDENT_URL || 'http://student-service:4002';

async function forward(req, res, baseUrl) {
  try {
    const response = await axios({
      method: req.method,
      url: baseUrl + req.originalUrl,
      data: req.body,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true, // pass downstream status codes straight through
      timeout: 10000,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(502).json({ error: 'Bad gateway', detail: err.message });
  }
}

app.get('/health', (req, res) => res.json({ service: 'api-gateway', status: 'ok' }));

// Registration microservice
app.use('/api/register', (req, res) => forward(req, res, REGISTRATION_URL));

// Student microservice (search / login / update / delete)
app.use('/api/students', (req, res) => forward(req, res, STUDENT_URL));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`API Gateway listening on port ${PORT}`));
