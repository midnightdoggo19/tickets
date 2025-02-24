const express = require('express');
const router = express.Router();
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { ticketsFile } = require('../functions');

let tickets = fs.existsSync(ticketsFile) ? JSON.parse(fs.readFileSync(ticketsFile)) : [];

// list tickets (requires authentication)
router.get('/', limiter, (req, res) => {
  res.json(tickets);
});

// max of 10 requests per minute
const registerLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 10
});

// create ticket (requires authentication)
router.post('/', limiter, (req, res) => {
  const { title, description } = req.body;
  const newTicket = { id: Date.now(), title, description, user: req.session.user };
  tickets.push(newTicket);
  fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));

  res.json(newTicket);
});

module.exports = router;
