var Sequelize = require("sequelize");
var sequelize = require("./db");

var CompanyOpportunity = sequelize.define('companyOpportunity', {
    /**
     * Title of the opportunity.
     */
    title: Sequelize.STRING,

    /**
     * Name of the company.
     */
    companyName: Sequelize.STRING,

    /**
     * Description of the opportunity.
     */
    description: Sequelize.STRING,

    /**
     * Link to the image of the company.
     */
    imageUrl: Sequelize.STRING,

    /**
     * Email to contact if you want the opportunity.
     */
    contactEmail: Sequelize.STRING,

    /**
     * Link to the opportunity on the website of the company.
     */
    link: Sequelize.STRING,

    /**
     * Level of education needed for the opportunity
     */
    educationLevel: Sequelize.STRING,

    /**
     * Category of the opportunity
     */
    category: Sequelize.STRING
})

CompanyOpportunity.sync();

module.exports = CompanyOpportunity;