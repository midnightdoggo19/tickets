const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { logger } = require('../../functions');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check if the bot is responsive!')
	.setContexts(0, 1),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });

		const statusEmbed = new EmbedBuilder()
			.setTitle('Bot Status')
			.addFields(
                { name: 'status', value: 'ok' },
                { name: 'uptime', value: String(process.uptime()) },
                { name: 'memoryUsage', value: JSON.stringify(process.memoryUsage()) },
                { name: 'nodeVersion', value: String(process.version) },
			)
			.setColor(0x00AE86)
			.setTimestamp();

	await interaction.editReply({ embeds: [statusEmbed], flags: 64 });
	},
};