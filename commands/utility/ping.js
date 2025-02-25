const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check if the bot is responsive!')
	.setContexts(0, 1),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });

		const status = await fetch(`http://${process.env.IP}:${process.env.PORT}/health`);

		const statusEmbed = new EmbedBuilder()
			.setTitle('Bot Status')
			.setDescription(status.join('\n'))
			.setColor(0x00AE86)
			.setTimestamp();

	await interaction.editReply({ embeds: [statusEmbed], flags: 64 });
	},
};