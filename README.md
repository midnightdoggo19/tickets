# Features
## Web
There's a web dashboard! NOTE: This is in beta and does not yet have authentication in place! You can disable it by setting the port to zero.
## Discord
```
/close - Closes the current ticket
/button - Creates a button to make tickets with
/top - Goes to the top of the ticket
/ping - Checks if the bot is online
/open - Opens a new ticket
/blacklist-add - Forbids users from accessing the bot
/role - Gives users the defined support role easily
/updateuser - Adds or removes a user from the current ticket
/support - Lists all members with the support role
/about - Provides information about the bot
/blacklist-remove - Removes a user from the blacklist
/blacklist-list - Lists blacklisted users
/register - Creates a new dashboard account
/addnote - Adds a note for a user
/editnote - Edits an existing note
/viewnote - Shows the note for a user
/removenote - Removes a note for a user
```
## NPM
```
npm start - Starts the bot
npm test - Makes sure package*.json is valid
npm run clear - Removes all archived tickets
npm run register - Registers slash commands with Discord
npm run validate - Validates .env
npm run setup - Setup directories (not required to run bot)
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
Copy the following into a file and name it `.env`:
```
# From Discord Developer Page of your bot
TOKEN='your bot token'
CLIENTID='the ID of the bot'

# From your server
TICKET_CATEGORY_ID = 'category ID' # Category in which active tickets will be created - make a **new** category for this! 
SUPPORT_ROLE_ID = 'role ID' # Role ID allowed to access tickets
ARCHIVECATEGORY = 'another category ID' # Where tickets go after being closed
GUILDID = 'guild ID'

# Everything below here is optional

# Logging (optional values - defaults will otherwise be used)
LOGLEVEL='info' # Can be updated as required

# Emojis - optional
# type a backslash (\) and then the emoji's name in the message box to get the ID
EMOJI_CREATE = '🎟️' # on create ticket button
EMOJI_DELETE = '⚠️' # on delete ticket button
EMOJI_VC = '🎙️' # on VC button

# Text
## Also optional
OPENTICKETTITLE = 'Ticket Created' # embed title
OPENTICKETBODY = 'A member of the support team will be with you soon.' # embed body
NOPERMISSION = 'You don\'t have permission to do that!' # When there's no permission
STATUS = 'for tickets' # "Watching for ____"

# Web
PORT = 3000 # set to 0 if you want to disable the dashboard
SECRET = 'openssl rand -hex 32' # run to generate secret
```
Install dependencies:
```
npm i
npm run register
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

# Links
[TODO](https://midnightdoggo19.com/tickets/TODO.md)
[Legal](https://midnightdoggo19.com/legal/)
