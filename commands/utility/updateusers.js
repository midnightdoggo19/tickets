const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { tickets } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateusers')
		.setDescription('Add or remove a a user from the current ticket')
	.addUserOption(option =>
		option.setName('user')
			.setDescription('User to add/remove')
			.setRequired(true)
	)
	.addStringOption(option =>
		option.setName('which')
			.setDescription('Add or remove')
			.setRequired(true)
			.addChoices(
				{ name: 'Add', value: 'add' },
				{ name: 'Remove', value: 'remov' },
	)),

	async execute(interaction) {
        await interaction.deferReply({flags: 64});

        if (!tickets[interaction.channel.id]) { interaction.editReply({content: 'Not a ticket!', flags: 64}) };

        if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({content: 'You don\'t have permission!', flags: 64})
        };

        const user = interaction.options.getUser('user');
        const choice = interaction.options.getString('which');

        if (choice === 'add') {
            interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true });
        } else {
            interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false, SendMessages: false });
        };

        await interaction.editReply({content: `User ${choice}ed`, flags: 64});
	},
};