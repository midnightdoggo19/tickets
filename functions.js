const { createLogger, transports, format } = require('winston');
const Transport = require('winston-transport');
require('dotenv').config();
const {
    EmbedBuilder,
    PermissionsBitField,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require('discord.js');
const { fetch } = require('undici');
const fs = require('node:fs');

const channelFile = './channels.json'
const dataFile = './data.json';
const usersFile = './users.json';
const notesFile = './notes.json';

const noPermission = process.env.NOPERMISSION || 'You don\'t have permission to do that!';

// let tickets = fs.existsSync(channelFile) ? JSON.parse(fs.readFileSync(channelFile)) : [];
let tickets = {};
let ticketNumber = 0 // default

function isJSON(str) { // maybe useful someday
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

async function removeBlacklist (userID) {
    const json = require(dataFile);
    delete json[userID];
    fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');
}

async function addBlacklist (userID) {
    const json = require(dataFile);
    json[userID]['blacklisted'] = true;
    fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');
}

async function getJSON (file) {
    const data = await JSON.parse(fs.readFileSync(file, 'utf8'));
    return Object.keys(data).join('\n');
}

async function getTotalTickets () {
    const data = JSON.parse(fs.readFileSync(channelFile, 'utf8'));
    return String(Object.keys(data).length);
}

async function webServerEnabled () {
    if (process.env.PORT == 0 || !process.env.PORT) { return false; } else { return true; }
}

async function getLatestCommit () {
    const response = await fetch('https://api.github.com/repos/midnightdoggo19/tickets/commits/master');
    const data = await response.json();
  
    if (response.ok) {
        let commit = [];

        commit.push(data.sha.substring(0, 6));
        commit.push(data.commit.message);
        return commit.join('\n')
    } else {
        logger.error('Error:', data.message);
        return;
    }
}

async function archiveChannel (channel) {
    if (!process.env.ARCHIVECATEGORY) {
        logger.warn('Archive category is not set in .env!');
        return 'Archive category is not set!';
    }
    let status;
    let existingChannels;
    try {
        existingChannels = JSON.parse(fs.readFileSync(channelFile, 'utf8'));
        status = await JSON.stringify(existingChannels[channel.id]['embed']);
    } catch (e) {
        logger.error(e);
        return;
    }

    // logger.debug(JSON.stringify(existingChannels));
    if (status === 'archived') { return 'Channel already archived!'; };

    logger.debug(await JSON.stringify(existingChannels));
    if (!existingChannels[channel.id]) { return 'Not a ticket!' };

    await channel.setParent(process.env.ARCHIVECATEGORY);
    await channel.permissionOverwrites.set([
        {
            id: process.env.GUILDID,
            deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: process.env.SUPPORTROLE,
            allow: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: process.env.CLIENTID,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.SendMessages]
        }
    ]);

    existingChannels[channel.id].status = 'archived';
    saveTickets(existingChannels);
    logger.info(`Ticket closed and archived: #${channel.name} (${channel.id})`);
    return `Ticket archived at <t:${Math.floor(Date.now() / 1000)}:F>`
}

async function claimTicket (userID, ticketID) {
    // logger.debug(userID);
    // logger.debug(ticketID);

    let existingChannels = JSON.parse(fs.readFileSync(channelFile, 'utf8'));

    if (!isNaN(existingChannels[ticketID]['claim'])) { return 'Ticket already claimed!'; }

    // logger.debug(JSON.stringify(existingChannels))
    if (!existingChannels[ticketID]) { return 'Not a ticket!' };

    existingChannels[ticketID].claim = userID;
    saveTickets(existingChannels);
    logger.info(`<#${ticketID}> claimed by <@${userID}>`);
    return `<#${ticketID}> claimed by <@${userID}>`;
}

async function createTicket(guild, user, ticketNumber) {
    const channel = await guild.channels.create({
        name: `ticket-${user.username}-${ticketNumber}`,
        type: 0, // text channel
        parent: String(process.env.TICKETCATEGORY),
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
                id: process.env.CLIENTID,
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
        // channel: channel.id,
        status: 'open',
        ticketNumber: ticketNumber,
        embed: Number(lastMessage.id),
        claim: 'not claimed idk what to put here since i can just check if it\'s a number'
    };

    saveTickets(tickets);
    logger.info(`Ticket #${ticketNumber} created by ${user.tag} in channel #${channel.name} (${channel.id})`);

    return channel;
}

class DiscordTransport extends Transport {
    constructor(opts) {
        super(opts);
        this.webhookUrl = process.env.LOGHOOK || 'https://midnightdoggo19.com/api/dontcare'; // will just ignore everything
    }

    async log(info, callback) {
        setImmediate(() => this.emit('logged', info));

        if (!this.webhookUrl) return callback();

        try {
            await fetch(this.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [
                        {
                            title: `Ticket Log`,
                            description: info.message,
                            color: 16711680,
                            timestamp: new Date().toISOString()
                        }
                    ]
                })
            });
        } catch (error) {
            console.error('Error sending log to Discord:', error);
        }
        callback();
    }
}

const logger = createLogger({
    level: process.env.LOGLEVEL || 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [ // log to console, discord, file
        new transports.Console(),
        new transports.File({ filename: `./tickets.log` }),
        new DiscordTransport()
    ]
});

async function saveTickets (save) {
    logger.info(`Saving ${await JSON.stringify(save)}`)
    fs.writeFileSync(channelFile, JSON.stringify(save, null, 2));
};

async function removeNote (userID) {
    const json = require(notesFile);
    if (!json[userID]) return 'No note set for user!';
    delete json[userID];
    fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');
}

async function addNote (userID, note) {
    logger.debug('adding note');
    const json = require(notesFile);
    // if ( !json[userID] ){ json[userID] = ''; logger.debug('here') }
    json[userID] = note;
    fs.writeFileSync(notesFile, JSON.stringify(json, null, 2), 'utf8');
    return note;
}

async function editNote (userID, note) {
    // logger.debug('editing note');
    const json = require(notesFile);
    if (!json[userID]) return 'No note set for user!';
    json[userID] = note;
    fs.writeFileSync(notesFile, JSON.stringify(json, null, 2), 'utf8');
    return note;
}

async function viewNote (userID) {
    const json = require(notesFile);
    if (!json[userID]) return 'No note set for user!';
    return json[userID];
}

module.exports = {
    archiveChannel,
    tickets,
    dataFile,
    logger,
    channelFile,
    ticketNumber,
    tickets,
    createTicket,
    noPermission,
    usersFile,
    getTotalTickets,
    isJSON,
    addBlacklist,
    getJSON,
    removeBlacklist,
    webServerEnabled,
    claimTicket,
    getLatestCommit,
    addNote,
    removeNote,
    notesFile,
    editNote,
    viewNote
}