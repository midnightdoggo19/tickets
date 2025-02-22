const { SlashCommandBuilder } = require('discord.js');
const { dataFile } = require('../../functions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription('Edit the blacklist'),
	async execute(interaction) {
		await interaction.deferReply()
		const json = require(dataFile);
        const user = interaction.options.getUser('user');

        if (interaction.options.getBoolean('remove') === true) {
            delete json[user.id];
        } else {
            json[user.id] = 'blacklisted';
        }
        fs.writeFileSync(dataFile, JSON.stringify(json, null, 2), 'utf8');

        interaction.editReply({ content: `Blacklisted <@${user.id}>`, flags: 64 });
	},
};