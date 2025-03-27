const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { removeNote } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('removenote')
		.setDescription('Remove a note from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove note from')
                .setRequired(true)
        )
		.setContexts(0),

	async execute(interaction) {
		await interaction.deferReply();

        if (!interaction.member.roles.cache.has(process.env.SUPPORTROLE) || !interaction.member.permissions.has([ // check if user can do that
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.Administrator,
            PermissionsBitField.Flags.ModerateMembers
        ])) {
            await interaction.editReply({content: noPermission, flags: 64})
        };
        const user = interaction.options.getUser('user');
        await removeNote(user.id);

        const noteEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Note removed')
            .setDescription(`Removed note from ${user.username}`)
            .setTimestamp();
            
        interaction.editReply({ embeds: [noteEmbed]});
	},
};