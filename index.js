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

const {
    logger, 
    channelFile, 
    createTicket, 
    archiveChannel, 
    dataFile, 
    addBlacklist, 
    notesFile, 
    getTicketNumber 
} = require('./functions');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

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
    logger.debug('command');
    // if (interaction.user.id in JSON.parse(fs.readFileSync(dataFile, 'utf8'))) { return; }
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