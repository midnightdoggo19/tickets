const { logger } = require('../functions');
require('dotenv').config();

// required stuff
if (!process.env.TOKEN) {
    logger.error('No token found!');
}
if (!process.env.CLIENTID || isNaN(process.env.CLIENTID)) {
    logger.error('No valid client ID found!');
}
if (!process.env.TICKETCATEGORY || isNaN(process.env.TICKETCATEGORY)) {
    logger.error('No valid category found!');
}
if (!process.env.ARCHIVECATEGORY || isNaN(process.env.ARCHIVECATEGORY)) {
    logger.error('No valid category found!');
}
if (!process.env.SUPPORTROLE || isNaN(process.env.SUPPORTROLE)) {
    logger.error('No valid support role found!')
}
if (!process.env.GUILDID|| isNaN(process.env.GUILDID)) {
    logger.error('No valid guild ID found!');
}
if (!process.env.PORT || isNaN(process.env.PORT)) {
    logger.error('No valid port found!')
}
if (process.env.PORT && !process.env.SECRET) {
    logger.error('Set a secret!')
}

logger.info('If this file outputted nothing else, you\'re probably good to go!');
