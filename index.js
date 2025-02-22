const { Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField,
    REST,
    Routes,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
require('dotenv').config();
const winston = require('winston');
const fs = require('fs');

const channelFile = './channels.json'
const dataFile = './data.json';

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

let tickets = {}; // for json

// create files if they don't exist
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}, null, 2), 'utf8');
}
if (!fs.existsSync(channelFile)) {
    fs.writeFileSync(channelFile, JSON.stringify({}, null, 2), 'utf8');
}

const commands = [
    {
        name: 'button',
        description: 'Make a ticket button',

    },
    {
        name: 'close',
        description: 'Close a ticket',

    },
    {
        name: 'open',
        description: 'Open a ticket'
    },
    {
        name: 'blacklist',
        description: 'Prevent a user from interacting with the bot',
        options: [
            {
                name: 'user',
                type: 6, // user
                description: 'User to add/remove',
                required: true,
            },
            {
                name: 'remove',
                type: 5,
                description: 'True: remove; False: add',
                required: true
            }
        ],
    },
    {
        name: 'top',
        description: 'Go to the top of the ticket'
    }
];

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Slash commands registered!');

    } catch (err) {
        console.error('Error registering slash commands:', err);
    }
})();

async function archiveChannel (channel) {
    if (!process.env.ARCHIVECATEGORY) {
        logger.warn('Archive category is not set in .env!');
        return 'Archive category is not set!'
    }

    const existingChannels = JSON.parse(fs.readFileSync(channelFile, 'utf8'));
    if (existingChannels.hasOwnProperty(channel.id) && existingChannels[channel.id].hasOwnProperty('status') && existingChannels[channel.id]['status'] === 'archived') { return 'Channel already archived!'; }

    await channel.setParent(process.env.ARCHIVECATEGORY);
    await channel.permissionOverwrites.set([
        {
            id: channel.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: process.env.SUPPORTROLE,
            allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: client.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.SendMessages]
        }
    ]);

    if (tickets[channel.id]) {
        tickets[channel.id].status = 'archived';
        saveTickets();
    }

    logger.info(`Ticket closed and archived: #${channel.name} (${channel.id})`);
    return `Ticket archived at <t:${Math.floor(Date.now() / 1000)}:F>`
}

async function createTicket(guild, user, ticketNumber) {
    if (!process.env.TICKETCATEGORY) {
        await interaction.reply({ content: 'Ticket category is not set!', flags: 64 });
    }

    const channel = await guild.channels.create({
        name: `ticket-${user.username}-${ticketNumber}`,
        type: 0, // 0 = text channel
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

    const embed = new EmbedBuilder()
        .setTitle('Ticket Created')
        .setDescription(process.env.OPENTICKETBODY || 'A member of the support team will be with you soon.')
        .setColor(0x00ff00);

    const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);

    const makeVCButton = new ButtonBuilder()
        .setCustomId('make_vc')
        .setLabel('Create VC')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
        .addComponents(closeButton, makeVCButton);

    await channel.send({ embeds: [embed], components: [row] });

    const messages = await channel.messages.fetch({ limit: 1 });
    const lastMessage = messages.first();

    tickets[channel.id] = {
        user: user.id,
        channel: channel.id,
        status: 'open',
        ticketNumber: ticketNumber,
        embed: Number(lastMessage.id)
    };

    saveTickets();
    logger.info(`Ticket #${ticketNumber} created by ${user.tag} in channel #${channel.name} (${channel.id})`);

    return channel;
}

const logger = winston.createLogger({
    level: process.env.LOGLEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: process.env.LOGFILE || 'logger.log' }),
    ]
});

const saveTickets = () => {
    fs.writeFileSync(channelFile, JSON.stringify(tickets, null, 2));
};

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

// button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    await interaction.deferReply()
    if (interaction.user.id in JSON.parse(fs.readFileSync(dataFile, 'utf8'))) { interaction.deleteReply(); return; }
    const guild = interaction.guild;
    const user = interaction.user;
    const userTickets = Object.values(tickets).filter(t => t.user === user.id);
    const ticketNumber = userTickets.length;

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

// command interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    await interaction.deferReply()
    if (interaction.user.id in JSON.parse(fs.readFileSync(dataFile, 'utf8'))) { interaction.deleteReply(); return; }
    if (interaction.commandName === 'button') {
        const embed = new EmbedBuilder()
            .setTitle('Support Ticket')
            .setDescription('Click the button below to open a ticket.')
            .setColor(0x00ff00);

        const createTicket = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder()
            .addComponents(createTicket);

        await interaction.channel.send({ embeds: [embed], components: [row] });

        interaction.deleteReply()
    } else if (interaction.commandName === 'close') {
        let a = await archiveChannel(interaction.channel)
        return interaction.reply({ content: a, flags: 64 });
    } else if (interaction.commandName === 'open') {

        const userTickets = Object.values(tickets).filter(t => t.user === interaction.user.id);
        const ticketNumber = userTickets.length;

        const channel = await createTicket(interaction.guild, interaction.user, ticketNumber)
        interaction.editReply({ content: `Ticket created: <#${channel.id}>`, flags: 64 });
    } else if (interaction.commandName === 'blacklist') {
        const json = require(dataFile);
        const user = interaction.options.getUser('user');

        if (interaction.options.getBoolean('remove') === true) {
            delete json[user.id];
        } else {
            json[user.id] = 'blacklisted';
        }
        fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');

        interaction.editReply({ content: `Blacklisted <@${user.id}>`, flags: 64 });
    } else if (interaction.commandName === 'top') {
        const existingChannels = JSON.parse(fs.readFileSync(channelFile, 'utf8'));
        const first = await JSON.stringify(existingChannels[interaction.channel.id]['embed']);
        await interaction.editReply(`[Jump to top](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.parentId}/${first})`);
    }
})

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

client.login(process.env.TOKEN);
