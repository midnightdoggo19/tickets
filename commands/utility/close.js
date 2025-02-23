const { SlashCommandBuilder } = require('discord.js');
const { archiveChannel } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('close')
		.setDescription('Close a ticket')
	.setContexts(0),
	
	async execute(interaction) {
		await interaction.deferReply({flags: 64})
		const a = await archiveChannel(interaction.channel.id);
        return interaction.editReply({ content: a, flags: 64 });
	},
};