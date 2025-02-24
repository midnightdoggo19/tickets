const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { noPermission, removeBlacklist } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist-remove')
		.setDescription('Remove a user from the blacklist')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove')
                .setRequired(true)
        )
        .setContexts(0),
	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });
        if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({content: noPermission, flags: 64})
        };

        const user = interaction.options.getUser('user');
        await removeBlacklist(user.id)

        await interaction.editReply({ content: `Blacklisted <@${user.id}>`, flags: 64 });
	},
};