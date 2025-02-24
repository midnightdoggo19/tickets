const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    REST,
    Collection,
    Events
} = require('discord.js');
const express = require('express');
const { logger, tickets, channelFile, createTicket, archiveChannel, dataFile, usersFile } = require('./functions')
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const favicon = require('serve-favicon');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
const activeVoiceChannels = new Map();
client.commands = new Collection();

const port = process.env.PORT || 3000;
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// create files if they don't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}, null, 2), 'utf8');
}
if (!fs.existsSync(channelFile)) {
    fs.writeFileSync(channelFile, JSON.stringify({}, null, 2), 'utf8');
}
if (!fs.existsSync('./logs/server.log')) {
    fs.writeFileSync('./logs/server.log', '', 'utf8');
}

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    await interaction.deferReply()
    if (interaction.user.id in JSON.parse(fs.readFileSync(dataFile, 'utf8'))) { interaction.deleteReply(); return; }
    const guild = interaction.guild;
    const user = interaction.user;
    let userTickets = Object.values(tickets).filter(t => t.user === user.id);
    let ticketNumber = userTickets.length;

    if (interaction.customId === 'create_ticket') {
        const channel = await createTicket(guild, user, ticketNumber)
        interaction.editReply({ content: `Ticket created: <#${channel.id}>`, flags: 64 });
    } else if (interaction.customId === 'close_ticket') {
        let a = await archiveChannel(interaction.channel)
        return interaction.editReply({ content: a, flags: 64 });

    } else if (interaction.customId === 'make_vc') {
        const VC = await guild.channels.create({
            name: `ticket-${user.username}-VC`,
            type: 2,
            parent: process.env.TICKETCATEGORY,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: process.env.SUPPORTROLE,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: client.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                }
            ]
        });
        await interaction.editReply({ content: 'VC Created!', flags: 64 });
        logger.info(`${interaction.user.username} created a new voice channel.`)
    }
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id in JSON.parse(fs.readFileSync(dataFile, 'utf8'))) { return; }
    if (interaction.guild.id != process.env.GUILDID) { return; }

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		logger.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		logger.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: 64 });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: 64 });
		}
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
    const channel = oldState.channel || newState.channel;
  
    if (!channel || channel.parentId !== process.env.TICKETCATEGORY) return;
  
    if (newState.channel) {
        if (activeVoiceChannels.has(channel.id)) {
            clearTimeout(activeVoiceChannels.get(channel.id));
            activeVoiceChannels.delete(channel.id);
        }
        return;
    }

    if (channel.members.size === 0) {
        const timeout = setTimeout(async () => {
            try {
            await channel.delete();
            activeVoiceChannels.delete(channel.id);
            } catch (err) {
                console.error(`Failed to delete voice channel: ${err}`);
            }
        }, 30000); // 30 seconds
        activeVoiceChannels.set(channel.id, timeout);
    }
});

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

// EXPRESS
// fetch tickets
const logFile = path.join(__dirname, './logs/server.log');
app.use(favicon(path.join(__dirname, 'public', 'assets/favicon.ico')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SECRET, // Change this to a strong, unique secret
    resave: false,
    saveUninitialized: true
}));

function expressLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(logFile, logEntry, 'utf8');
}

app.use((req, res, next) => {
    expressLog(`Request: ${req.method} ${req.url}`);
    next();
});

app.use(express.static('public'));
app.set('trust proxy', 1);

app.get('/api/tickets', (req, res) => {
    fs.readFile(channelFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read ticket data' });
        }
        const ticketsObj = JSON.parse(data);
        const apiTickets = Object.keys(ticketsObj).map(channelID => ({
            id: channelID,
            user: ticketsObj[channelID].user,
            status: ticketsObj[channelID].status,
            issue: `Ticket #${ticketsObj[channelID].ticketNumber}`
        }));
        res.json(apiTickets);
    });
});

// closing tickets
app.post('/api/tickets/:id/close', async (req, res) => {
    const ticketId = req.params.id;
    const apiChannel = await client.channels.fetch(ticketId);
    archiveChannel(apiChannel);
    res.json({ success: true, message: `Ticket ${ticketId} closed` });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile)) : {};

// registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (users[username]) return res.status(400).send('User already exists');
  
    const hashedPassword = await bcrypt.hash(password, 10);
    users[username] = { password: hashedPassword };
  
    console.log('Users before saving:', users);
  
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
        console.log('Users saved successfully.');
        res.send('User registered successfully');
    } catch (err) {
        console.error('Error saving users:', err);
        res.status(500).send('Error saving user');
    }
  });

// login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid credentials');
    }

    req.session.user = username;
    res.send('Login successful');
});

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    next();
}

app.get('/tickets', requireAuth, (req, res) => {
    res.json(tickets);
});

if (port != 0) { // disable web if port is zero
    app.listen(port, process.env.IP || '0.0.0.0', () => {
        expressLog(`Dashboard running at http://${process.env.IP || '0.0.0.0'}:${port}`);
    });
}