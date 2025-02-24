const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getTotalTickets, webServerEnabled } = require('../../functions');
require('dotenv').config();
let serverStatus;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Information about the bot')
	.setContexts(0, 1),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });

        const total = await getTotalTickets();

        if (await webServerEnabled() === true) {
            serverStatus = 'Online';
        } else {
            serverStatus = 'Offline';
        }

        const about = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Support Tickets')
            .setURL('https://github.com/midnightdoggo19/tickets')
            .setAuthor({ name: 'Midnight Doggo', iconURL: 'https://avatars.githubusercontent.com/u/71900479?v=4', url: 'https://midnightdoggo19.com' })
            .setDescription('Yet another ticket bot for Discord')
            .addFields(
                { name: 'Support Role', value: `<@&${process.env.SUPPORTROLE}>`},
                { name: 'Total Tickets', value: total || 'Unknown'},
                { name: 'Webserver Status', value: serverStatus},
            )
            .setTimestamp();

        interaction.editReply({ embeds: [about], flags: 64 });
	},
};