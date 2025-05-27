const { SlashCommandBuilder } = require('discord.js');
const { createTicket, logger } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('open')
		.setDescription('Open a ticket')
	.setContexts(0),

	async execute(interaction) {
		await interaction.deferReply()
		logger.debug('opening command');
        const channel = await createTicket(interaction.guild, interaction.user);
        await interaction.editReply({ content: `Ticket created: #${channel}`, flags: 64 });
	},
};