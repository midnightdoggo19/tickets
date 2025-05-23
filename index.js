const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    REST,
    Collection,
    Events,
    PresenceUpdateStatus,
    ActivityType
} = require('discord.js');
const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    logger, 
    channelFile, 
    createTicket, 
    archiveChannel, 
    dataFile, 
    usersFile, 
    addBlacklist, 
    notesFile, 
    register, 
    getTicketNumber 
} = require('./functions');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const favicon = require('serve-favicon');
const app = express();
const session = require('express-session');
const bcrypt = require('bcrypt');
const requestIp = require('request-ip');

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
if (!fs.existsSync(notesFile)) {
    fs.writeFileSync(notesFile, JSON.stringify({}, null, 2), 'utf8');
}
if (!fs.existsSync('./tickets.log')) {
    fs.writeFileSync('./tickets.log', '', 'utf8');
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
    await interaction.deferReply();
    const guild = interaction.guild;
    const user = interaction.user;
    await getTicketNumber(interaction.user.id);

    if (interaction.customId === 'create_ticket') {
        await createTicket(guild, user);
	    await interaction.deleteReply();
        // await interaction.editReply({ content: `Ticket created: <#${channel.id}>`, flags: 64 });
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
    client.user.setActivity(process.env.STATUS || 'for tickets', { type: ActivityType.Watching });
});

client.login(process.env.TOKEN);

// EXPRESS
// fetch tickets
app.use(favicon(path.join(__dirname, 'public', 'assets/favicon.ico')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const router = express.Router();
app.use(requestIp.mw());

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        httpOnly: true
    }
}));

// max of 100 requests per 15 minutes
const rootLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
});

// max of 10 requests per minute
const registerLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // a minute
    max: 10
});

function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).send('Unauthorized');
    next();
}

app.use((req, res, next) => {
    logger.info(`Request from ${req.clientIp}: ${req.method} ${req.url}`);
    next();
});

app.use(express.static('public'));
app.set('trust proxy', 1);

app.use((req, res, next) => { // tells crawlers not to index any of this (if they'd listen)
    res.setHeader('X-Robots-Tag', 'noindex');
    next();
});

app.get('/', rootLimiter, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// <info>

app.get('/api/info/health', rootLimiter, (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        logLevel: process.env.LOGLEVEL
    });
});  

app.get('/api/info/server', rootLimiter, (req, res) => {
    res.json({
        port: process.env.PORT || 'No port set!',
        ip: process.env.IP || 'No IP set!'
    });
})

app.get('/api/info/bot', rootLimiter, (req, res) => {
    res.json({
        username: client.username,
        supportRole: process.env.SUPPORTROLE,
        status: process.env.STATUS
    });
});

// </info>
// <tickets>

app.get('/api/tickets', rootLimiter, (req, res) => {
    fs.readFile(channelFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read ticket data' });
        }
        const ticketsObj = JSON.parse(data);
        const apiTickets = Object.keys(ticketsObj).map(channelID => ({
            id: channelID,
            user: ticketsObj[channelID].user,
            status: ticketsObj[channelID].status,
            issue: ticketsObj[channelID].ticketNumber
        }));
        res.json(apiTickets);
    });
});

// closing tickets
app.post('/api/tickets/:id/close', requireAuth, async (req, res) => {
    logger.debug('e');
    const ticketID = req.params.id;
    if (isNaN(ticketID)) { res.status(400).send('Error closing ticket'); return; }
    const channel = await client.channels.fetch(ticketID);
    logger.debug(JSON.stringify(channel));
    await archiveChannel(channel);
    res.json({ success: true, message: `Ticket ${ticketID} closed` });
});

// </tickets>
// <dashboard-auth>

// registration
app.post('/api/register', registerLimiter, async (req, res) => {
    const { username, password } = req.body;
    res.send(await register(username, password));
});

// login
app.post('/api/login', rootLimiter, async (req, res) => {
    const { username, password } = req.body;
    const users = fs.existsSync(usersFile) ? JSON.parse(fs.readFileSync(usersFile)) : {};
    const user = users[username];

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid credentials');
    }

    req.session.user = username;
    res.send('Login successful');
});

// </dashboard-auth>
// <blacklist>

// app.get('/api/blacklist/list', rootLimiter, async (req, res) => {
//     res.json(getJSON(dataFile));
// });

app.post('/api/blacklist/add', rootLimiter, requireAuth, async (req, res) => {
    const { id } = req.body;
    if (isNaN(id)) { res.status(400).send('Error saving user'); return; }
    await addBlacklist(id);
    res.send(`Removed ${id} from blacklist`);
});

// </blacklist>

// app.get('/api/tickets', requireAuth, (req, res) => {
//     res.json(tickets);
// });

// router.get('/', rootLimiter, (req, res) => {
//   res.json(tickets);
// });

// router.post('/', rootLimiter, (req, res) => {
//   const { title, description } = req.body;
//   const newTicket = { id: Date.now(), title, description, user: req.session.user };
//   tickets.push(newTicket);
//   fs.writeFileSync(ticketsFile, JSON.stringify(tickets, null, 2));

//   res.json(newTicket);
// });

if (port != 0) { // disable web if port is zero
    app.listen(port, process.env.IP || 'localhost', () => {
        logger.info(`Dashboard running at http://${process.env.IP}:${port}`);
    });
}
