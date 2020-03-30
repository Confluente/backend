module.exports = {
    /**
     * Takes an array of strings, and transforms it into a single string for use in the database
     * None of the strings should contain the preserved character combination #,#
     * @param array
     * @returns {string}
     */
    stringifyArrayOfStrings: function (array) {
        if (array.length === 0) return "";

        let result = "";
        for (let i = 0; i < array.length - 1; i++) {
            result += array[i];
            result += "#,#";
        }
        result += array[array.length - 1];
        return result;
    },

    /**
     * Takes a string as used for storing an array of strings in the database, and transforms it back to an array of strings
     * @param string
     * @returns {array}
     */
    destringifyStringifiedArrayOfStrings: function (string) {
        if (string.length === 0) return [];

        return string.split("#,#");
    },

    /**
     * Takes an array of numbers, and transforms it into a single string for use in the database
     * @param array
     * @returns {string}
     */
    stringifyArrayOfNumbers: function (array) {
        let result = "";
        for (let i = 0; i < array.length - 1; i++) {
            result += array[i].toString();
            result += "#,#";
        }
        result += array[array.length - 1];
        return result;
    },

    /**
     * Takes a string as used for storing an array of numbers in the database, and transforms it back to an array of numbers
     * @param string
     * @returns {array}
     */
    destringifyStringifiedArrayOfNumbers: function (string) {
        if (string.length === 0) return [];

        let result = string.split("#,#");

        for (let i = 0; i < result.length; i++) {
            result[i] = parseInt(result[i]);
        }

        return result;
    }
};