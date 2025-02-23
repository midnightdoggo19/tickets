const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle
} = require('discord.js');
require('dotenv').config()

module.exports = {
	data: new SlashCommandBuilder()
		.setName('button')
		.setDescription('Make a ticket button')
	.setContexts(0),
	
	async execute(interaction) {
		await interaction.deferReply()
		const embed = new EmbedBuilder()
			.setTitle('Support Ticket')
			.setDescription('Click the button below to open a ticket.')
			.setColor(0x00ff00);

		const createTicket = new ButtonBuilder()
			.setCustomId('create_ticket')
			.setLabel('Create Ticket')
			.setStyle(ButtonStyle.Success)
			.setEmoji(process.env.EMOJI_CREATE || '🎟️');

		const row = new ActionRowBuilder()
			.addComponents(createTicket);

		await interaction.channel.send({ embeds: [embed], components: [row] });

		interaction.deleteReply()
	},
};