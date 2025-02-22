const winston = require('winston');
require('dotenv').config()
const {
    EmbedBuilder,
    PermissionsBitField,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require('discord.js');

const fs = require('node:fs');

const channelFile = './channels.json'
const dataFile = './data.json';

const noPermission = process.env.NOPERMISSION || 'You don\'t have permission to do that!';

let tickets = {}; // for json
let ticketNumber = 0 // default

async function archiveChannel (channel) {
    if (!process.env.ARCHIVECATEGORY) {
        logger.warn('Archive category is not set in .env!');
        return 'Archive category is not set!';
    }

    if (!tickets[channel.id]) { return 'Not a ticket!' };

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
            id: process.env.CLIENT_ID,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.SendMessages]
        }
    ]);

    tickets[channel.id].status = 'archived';
    saveTickets();

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
                id: process.env.CLIENT_ID,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            }
        ]
    });

    const embed = new EmbedBuilder()
        .setTitle(process.env.OPENTICKETTITLE || 'Ticket Created')
        .setDescription(process.env.OPENTICKETBODY || 'A member of the support team will be with you soon.')
        .setColor(0x00ff00);

    const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(process.env.EMOJI_DELETE || '⚠️');

    const makeVCButton = new ButtonBuilder()
        .setCustomId('make_vc')
        .setLabel('Create VC')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(process.env.EMOJI_VC || '🎙️');

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

module.exports = { archiveChannel, tickets, dataFile, logger, channelFile, ticketNumber, tickets, createTicket, noPermission }