const express = require('express');
const router = express.Router();
const fs = require('fs');

const ticketsFile = 'channels.json';
let tickets = fs.existsSync(ticketsFile) ? JSON.parse(fs.readFileSync(ticketsFile)) : [];

// List tickets (requires authentication)
router.get('/', (req, res) => {
  res.json(tickets);
});

// Create ticket (requires authentication)
router.post('/', (req, res) => {
  const { title, description } = req.body;
  const newTicket = { id: Date.now(), title, description, user: req.session.user };
  tickets.push(newTicket);
  fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));

  res.json(newTicket);
});

module.exports = router;
