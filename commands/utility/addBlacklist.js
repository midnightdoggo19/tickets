const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { noPermission, addBlacklist, logger } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist-add')
		.setDescription('Add a user to the blacklist')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to add')
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
            await interaction.editReply({content: noPermission, flags: 64});
            return;
        };

        const user = interaction.options.getUser('user');
        await addBlacklist(user.id);

        await interaction.editReply({ content: `Blacklisted <@${user.id}>`, flags: 64 });
	},
};