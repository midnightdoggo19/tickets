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

const channelFile = process.env.DATAFILE || "channels.json"

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

let tickets = {};
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
            .setDescription('A member of support team will be with you soon.')
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

        await channel.send({ embeds: [embed], components: [closeButton] });
        interaction.reply({ content: `Ticket created: <#${channel.id}>`, flags: 64 });
    }

    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;

        if (!process.env.ARCHIVECATEGORY) {
            logger.warn('Archive category is not set in .env!');
            return interaction.reply({ content: 'Archive category is not set!', flags: 64 });
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
            }
        ]);

        if (tickets[channel.id]) {
            tickets[channel.id].status = 'archived';
            saveTickets();
        }

        logger.info(`Ticket closed and archived: #${channel.name} (${channel.id})`);
        interaction.reply({ content: 'Ticket has been archived.', flags: 64 });
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!button') {
        if (!process.env.IDs.includes(message.author.id)) {
            logger.warn(`Unauthorized user ${message.author.id} attempted to use a command.`);
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

        await message.delete()
    }
});

client.login(process.env.TOKEN);
