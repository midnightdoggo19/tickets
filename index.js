const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const winston = require('winston');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

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

        const channel = await guild.channels.create({
            name: `ticket-${user.username}`,
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
        await interaction.channel.delete();
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!ticket') {
        if (!process.env.IDs.includes(message.author.id)) { logger.warn(`Unauthorized user ${message.author.id} attempted to use a command.`); return; } // limit to defined users
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
    }
});

client.login(process.env.TOKEN);