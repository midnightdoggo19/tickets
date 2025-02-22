const { SlashCommandBuilder } = require('discord.js');
const { archiveChannel } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('close')
		.setDescription('Close a ticket'),
	async execute(interaction) {
		await interaction.deferReply()
		const a = await archiveChannel(interaction.channel);
        return interaction.editReply({ content: a, flags: 64 });
	},
};