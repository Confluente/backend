var Sequelize = require("sequelize");
var db = require("./db");
var Group = require("./group");

var Activity = db.define('activity', {

    /**
     * Name of the activity.
     */
    name: Sequelize.STRING,

    /**
     * Description of the activity.
     */
    description: Sequelize.STRING,

    /**
     * Location of the activity.
     */
    location: Sequelize.STRING,

    /**
     * Date of the activity.
     */
    date: Sequelize.DATE,

    /**
     * Start time of the activity.
     */
    startTime: Sequelize.TIME,

    /**
     * End time of the activity.
     */
    endTime: Sequelize.TIME,

    /**
     * canSubscribes stores whether members can subscribe to the activity.
     */
    canSubscribe: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },

    /**
     * Participation fee of the activity.
     */
    participationFee: Sequelize.DECIMAL,

    /**
     * Number of questions in the subscription form.
     */
    numberOfQuestions: Sequelize.INTEGER,

    /**
     * Type of questions in the subscription form.
     * For every question the string stores whether the question is text, multiple choice or checkboxes.
     * Types are separated by #,# delimiter.
     */
    typeOfQuestion: Sequelize.STRING,

    /**
     * Questions of the subscription form.
     * For every question the string stores the description (actual question).
     * Descriptions are separated by #,# delimiter.
     */
    questionDescriptions: Sequelize.STRING,

    /**
     * Options for multiple choice and checkbox questions in form.
     * For every question the string stores the options.
     * Options of different questions are separated by #,#.
     * Options for the same question are separated by #;#.
     */
    formOptions: Sequelize.STRING,

    /**
     * Which questions are required.
     * For every question the string stores true or false.
     * Separated by #,#.
     */
    required: Sequelize.STRING,

    /**
     * Which questions are private (answers of private questions do not show to everyone).
     * For every question the string stores true or false.
     * Separated by #,#.
     */
    privacyOfQuestions: Sequelize.STRING,

    /**
     * Subscription deadline of the activity.
     */
    subscriptionDeadline: Sequelize.DATE,

    /**
     * Stores whether the activity is published.
     */
    published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },

    /**
     * Stores whether the activity has a cover image
     */
    hasCoverImage: Sequelize.BOOLEAN
});

// Relates activities to a group that organizes the activity.
Activity.Organizer = Activity.belongsTo(Group, {as: "Organizer", onDelete: 'CASCADE'});

Activity.sync();
Group.sync();
db.sync();

module.exports = Activity;
