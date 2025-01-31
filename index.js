const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const winston = require('winston');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

async function archiveChannel (messageThingy, isInteraction) {
    let member = messageThingy.member;
    if (!member.roles.cache.has(process.env.SUPPORTROLE)) {
        logger.info(`${messageThingy.member.name} tried to close ${messageThingy.channel.name} but lacked permissions to do so.`)
        try {
            messageThingy.reply({ content: 'You can\'t do that!', flags: 64 });
        }
        catch (interactionAlreadyReplied) {
            logger.warn('A ticket closure interaction was just attemped one or more times; rejected by Discord.')
        }
    }

    let channel = messageThingy.channel;

    if (!process.env.ARCHIVECATEGORY) {
        logger.warn('Archive category is not set in .env!');
        return messageThingy.reply({ content: 'Archive category is not set!', flags: 64 });
    }

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
    if (isInteraction) { messageThingy.reply({ content: 'Ticket has been archived.', flags: 64 }); }
    else (messageThingy.react(process.env.REACT || '✅')) // Can't get an ephemeral response to a normal message, so a reaction will have to do!
}

const channelFile = process.env.DATAFILE || 'channels.json'

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

let tickets = {}; // for json
if (fs.existsSync(channelFile)) {
    try {
        tickets = JSON.parse(fs.readFileSync(channelFile));
    } catch (error) {
        logger.error('Failed to load ticket data:', error);
    }
}

const saveTickets = () => {
    fs.writeFileSync(channelFile, JSON.stringify(tickets, null, 2));
};

client.once('ready', () => {
    logger.info(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        if (!process.env.TICKETCATEGORY) {
            return interaction.reply({ content: 'Ticket category is not set!', flags: 64 });
        }

        const userTickets = Object.values(tickets).filter(t => t.user === user.id);
        const ticketNumber = userTickets.length;

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

        tickets[channel.id] = {
            user: user.id,
            channel: channel.id,
            status: 'open',
            ticketNumber: ticketNumber
        };
        saveTickets();

        logger.info(`Ticket #${ticketNumber} created by ${user.tag} in channel #${channel.name} (${channel.id})`);

        const embed = new EmbedBuilder()
            .setTitle('Ticket Created')
            .setDescription(process.env.OPENTICKETBODY || 'A member of the support team will be with you soon.')
            .setColor(0x00ff00);

        const closeButton = {
            type: 1,
            components: [
                {
                    type: 2,
                    label: 'Close Ticket',
                    style: 4,
                    custom_id: 'close_ticket'
                }
            ]
        };

        try{
            await channel.send({ embeds: [embed], components: [closeButton] });
            interaction.reply({ content: `Ticket created: <#${channel.id}>`, flags: 64 });
        }
        catch (DiscordAPIError) {
            logger.error('An error occured, probably couldn\'t access the ticket category.')
        }
    }

    if (interaction.customId === 'close_ticket') {
        archiveChannel(interaction, true)
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!openbutton') {
        if (!process.env.IDs.includes(message.author.id)) {
            logger.info(`Unauthorized user ${message.author.id} attempted to use the "!button" command.`);
            return;
        } // limit to defined users

        const embed = new EmbedBuilder()
            .setTitle('Support Ticket')
            .setDescription('Click the button below to open a ticket.')
            .setColor(0x00ff00);

        const button = {
            type: 1,
            components: [
                {
                    type: 2,
                    label: 'Create Ticket',
                    style: 1,
                    custom_id: 'create_ticket'
                }
            ]
        };

        await message.channel.send({ embeds: [embed], components: [button] });

        await message.delete() // get rid of the command message (not the command response)
    }

    else if (message.content === '!close') {
        if (tickets[message.channelId]) {
            archiveChannel(message, false)
        }
    }
});

client.login(process.env.TOKEN);
