# Features
## Discord
```
/close - close the current ticket
/button - create a button to make tickets with
/top - Go to the top of the ticket
/ping - Check if the bot is online
/open - Open a new ticket
/blacklist - Forbid users from accessing the bot
/role - Give users the defined support role easily
/updateuser - Add or remove a user from the current ticket
```
## NPM
```
npm start - run the bot
npm test - make sure package*.json is valid
npm run clear - remove all old tickets from the archive category
npm run register - register slash commands with discord
```

# Installation

Clone the repo:
```
git clone https://github.com/midnightdoggo19/tickets.git
```
Enter the new directory:
```
cd tickets
```
Install dependencies:
```
npm run register
npm i
```
Fill the information in `.example.env` and rename it to `.env`:
```
# From Discord Developer Page of your bot
TOKEN='your bot token'
CLIENT_ID='the ID of the bot'

# From your server
TICKET_CATEGORY_ID = 'category ID' # Category in which active tickets will be created - make a **new** category for this! 
SUPPORT_ROLE_ID = 'role ID' # Role ID allowed to access tickets
ARCHIVECATEGORY = 'another category ID' # Where tickets go after being closed

# Logging (optional values - defaults will otherwise be used)
LOGFILE='tickets.log' # Where logs are saved
LOGLEVEL='info' # Can be updated as required
```

The bot is now ready to run:
```
npm start
```
## Required Intents:
* Server Members
* Message Content
## Required Permissions:
![Permissions](https://github.com/user-attachments/assets/8581133a-c545-4a00-8ee3-1718cafd7b0a)
