const { SlashCommandBuilder } = require('discord.js');
const { channelFile } = require('../../functions');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('top')
		.setDescription('Go to the top of the ticket'),
	async execute(interaction) {
		await interaction.deferReply()
		const existingChannels = JSON.parse(fs.readFileSync(channelFile, 'utf8'));
        const first = await JSON.stringify(existingChannels[interaction.channel.id]['embed']);
        await interaction.editReply(`[Jump to top](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.parentId}/${first})`);
	},
};