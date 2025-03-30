const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { addNote } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addnote')
		.setDescription('Add a note to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to create note for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('note')
                .setDescription('Note to add')
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
        const note = interaction.options.getString('note');
        const user = interaction.options.getUser('user');
        await addNote(user.id, note);

        const noteEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Added Note')
            .setDescription(note)
            .setTimestamp();
            
        interaction.editReply({ embeds: [noteEmbed]});
	},
};