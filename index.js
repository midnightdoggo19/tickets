const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TICKET_CATEGORY_ID = '1334221356153438320';
const SUPPORT_ROLE_ID = '1334221449304473700';

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const user = interaction.user;

        if (!TICKET_CATEGORY_ID) {
            return interaction.reply({ content: 'Ticket category is not set!', flags: 64 });
        }

        const channel = await guild.channels.create({
            name: `ticket-${user.username}`,
            type: 0, // 0 = text channel
            parent: TICKET_CATEGORY_ID,
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
                    id: SUPPORT_ROLE_ID,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                }
            ]
        });

        const embed = new EmbedBuilder()
            .setTitle('Ticket Created')
            .setDescription('Support will be with you soon.')
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
        if (!process.env.IDs.includes(interaction.user.id)) { logger.warn(`Unauthorized user ${interaction.user.username} attempted to use a command.`); return; } // limit to defined users
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
