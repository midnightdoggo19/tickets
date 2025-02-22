const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check if the bot is responsive!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};