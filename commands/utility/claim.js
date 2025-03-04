const { SlashCommandBuilder } = require('discord.js');
const { claimTicket } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('claim')
		.setDescription('Claim a ticket')
		.setContexts(0),

	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });
        const claim = await claimTicket(interaction.user.id, interaction.channel.id);
        await interaction.editReply(claim);
	},
};