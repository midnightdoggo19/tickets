const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get info on the different commands the bot has'),
	async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

		const embed = new EmbedBuilder()
            .setTitle('Ticket Help')
            .addFields(
                { name: '/close', value: 'Closes the current ticket' },
                { name: '/button', value: 'Creates a "Open Ticket" button' },
                { name: '/top', value: 'Lets you go to the top of the ticket' },
                { name: '/ping', value: 'Checks if the bot is responsive' },
                { name: '/open', value: 'Opens a ticket' },
                { name: '/blacklist', value: 'Prevents a user from interacting with the bot' },
                { name: '/role', value: 'Gives a user the support role' },
                { name: '/updateuser', value: 'Adds/removes a user from a ticket' },
            )
            .setColor('135f91');

        await interaction.editReply({ embeds: [embed], flags: 64});
	},
};