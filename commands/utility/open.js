const { SlashCommandBuilder } = require('discord.js');
const { createTicket, ticketNumber, tickets } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('open')
		.setDescription('Open a ticket'),
	async execute(interaction) {
		await interaction.deferReply()

		const userTickets = Object.values(tickets).filter(t => t.user === interaction.user.id);
        const ticketNumber = userTickets.length;

        const channel = await createTicket(interaction.guild, interaction.user, ticketNumber)
        interaction.editReply({ content: `Ticket created: <#${channel.id}>`, flags: 64 });
	},
};