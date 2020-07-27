var Sequelize = require("sequelize");
var sequelize = require("./db");

var Internship = sequelize.define('internship', {
    /**
     * Title of the internship.
     */
    title: Sequelize.STRING,

    /**
     * Name of the company.
     */
    companyName: Sequelize.STRING,

    /**
     * Description of the internship.
     */
    description: Sequelize.STRING,

    /**
     * Link to the image of the company.
     */
    imageUrl: Sequelize.STRING,

    /**
     * Email to contact if you want the internship.
     */
    contactEmail: Sequelize.STRING,

    /**
     * Link to the internship on the website of the company.
     */
    internshipLink: Sequelize.STRING,

    /**
     * Level of education needed for the internship
     */
    educationLevel: Sequelize.STRING,

    /**
     * Category of the internship
     */
    category: Sequelize.STRING
})

Internship.sync();

module.exports = Internship;