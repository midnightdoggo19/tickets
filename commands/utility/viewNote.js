const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { viewNote } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('viewnote')
		.setDescription('View note for user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view')
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
            await interaction.editReply({content: noPermission, flags: 64});
            return;
        };
        const user = interaction.options.getUser('user');
        const note = await viewNote(user.id);

        const noteEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Note for ${user.username}`)
            .setDescription(note)
            .setTimestamp();
            
        interaction.editReply({ embeds: [noteEmbed]});
	},
};