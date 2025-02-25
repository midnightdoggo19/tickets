const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { dataFile, getJSON } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist-list')
		.setDescription('List blacklisted user IDs')
        .setContexts(0),
    
	async execute(interaction) {
        // maybe make permission-locked?
		await interaction.deferReply({ flags: 64 });

        const list = await getJSON();

        const blacklisted = new EmbedBuilder()
            .setTitle('Blacklisted Users')
            .setDescription(list)
            .setColor(0x00AE86) // Customize color
            .setTimestamp();

        await interaction.editReply({ embeds: [blacklisted], flags: 64 });
	},
};