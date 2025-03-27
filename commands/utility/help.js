const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config()

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
                { name: '/button', value: 'Creates an "Open Ticket" button' },
                { name: '/top', value: 'Lets you go to the top of the ticket' },
                { name: '/ping', value: 'Checks if the bot is responsive' },
                { name: '/open', value: 'Opens a ticket' },
                { name: '/blacklist-add', value: 'Prevents a user from interacting with the bot' },
                { name: '/role', value: 'Gives a user the support role' },
                { name: '/updateuser', value: 'Adds/removes a user from a ticket' },
                { name: '/support', value: `List all users with <@&${process.env.SUPPORTROLE}>` },
                { name: '/about', value: 'Some info on the bot'},
                { name: '/blacklist-remove', value: 'Remove a user from the blacklist' },
                { name: '/blacklist-list', value: 'List blacklisted users' },
                { name: '/register', value: 'Registers a new account on the dashboard'},
                { name: '/addnote', value: 'Adds a note for a user'},
                { name: '/editnote', value: 'Edits an existing note'},
                { name: '/viewnote', value: 'Shows the note for a user'},
                { name: '/removenote', value: 'Removes the note for a user'},
            )
            .setColor('135f91');

        await interaction.editReply({ embeds: [embed], flags: 64});
	},
};
