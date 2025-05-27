const { SlashCommandBuilder } = require('discord.js');
const { archiveChannel, logger } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('close')
		.setDescription('Close a ticket')
	.setContexts(0),
	
	async execute (interaction) {
		await interaction.deferReply({flags: 64});
		// logger.debug('attempting to close ticket via command');
		const a = await archiveChannel(interaction.channel);
        await interaction.editReply({ content: a, flags: 64 });
	},
};