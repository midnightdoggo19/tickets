# Instructions for Use

Clone the repo:
```
git clone https://github.com/midnightdoggo19/tickets
```
Enter the new directory:
```
cd tickets
```
Install dependencies:
```
npm i
```
Fill the information in `.example.env` and rename it to `.env`:
```
# From Discord Developer Page of your bot
TOKEN='your bot token'
CLIENT_ID='the ID of the bot'
REACT='any emoji ID' # upload an emoji and click "Copy Markdown" to get this value (optional)

# From your server
TICKET_CATEGORY_ID = 'category ID' # Category in which active tickets will be created - make a **new** category for this! 
SUPPORT_ROLE_ID = 'role ID' # Role ID allowed to access tickets
ARCHIVECATEGORY = 'another category ID' # Where tickets go after being closed
IDs=[ 'a user ID', 'another user ID'] # Users allowed to issue commands - not required to manage tickets

# Logging (optional values - defaults will otherwise be used)
LOGFILE='tickets.log' # Where logs are saved
LOGLEVEL='info' # Can be updated as required
DATAFILE = 'channels.json' # Ticket data location
```

The bot is now ready to run:
```
npm start
```
# Required Intents:
* Server Members
* Message Content
# Required Permissions:
![perms](https://github.com/user-attachments/assets/d47c05cf-5c49-4523-a3d8-70c2dc1176c2)
