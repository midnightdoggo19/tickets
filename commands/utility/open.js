const { SlashCommandBuilder } = require('discord.js');
const { createTicket } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('open')
		.setDescription('Open a ticket')
	.setContexts(0),

	async execute(interaction) {
		await interaction.deferReply()

        const channel = await createTicket(interaction.guild, interaction.user)
        await interaction.editReply({ content: `Ticket created: <#${channel.id}>`, flags: 64 });
	},
};