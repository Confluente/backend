module.exports = {
    /**
     * Takes an dictionary with strings as both keys and values, and transforms it into a single string for use in the database
     * None of the strings should contain the preserved character combination #,#
     * @param dictionary
     * @returns {string}
     */
    stringifyDictionaryOfStrings: function (dictionary) {
        if (dictionary.length === 0) return "";

        let result = "";
        for (let key in dictionary) {
            result += key;
            result += "#,#";
            result += dictionary[key];
            result += "#,#";
        }

        // Remove final separator
        result = result.slice(0, -3);

        return result;
    },

    /**
     * Takes a string as used for storing a dictionary of strings in the database, and transforms it back to an dictionary of strings
     * @param string
     * @returns {dictionary}
     */
    destringifyStringifiedDictionaryOfStrings: function (string) {
        if (string.length === 0) return {};

        // Create temporary array to parse the string
        let array = string.split("#,#");

        let result = {};

        // Construct dictionary from array
        for (let i = 0; i < array.length; i += 2) {
            result[array[i]] = array[i + 1];
        }

        return result;
    },

    /**
     * Takes an dictionary with strings as keys and numbers as values, and transforms it into a single string for use in the database
     * @param dictionary
     * @returns {string}
     */
    stringifyDictionaryOfNumbers: function (dictionary) {
        if (dictionary.length === 0) return "";

        let result = "";
        for (let key in dictionary) {
            result += key;
            result += "#,#";
            result += dictionary[key].toString();
            result += "#,#";
        }

        // Remove final separator
        result = result.slice(0, -3);

        return result;
    },

    /**
     * Takes a string as used for storing a dictionary of numbers in the database, and transforms it back to an dictionary of numbers
     * @param string
     * @returns {dictionary}
     */
    destringifyStringifiedDictionaryOfNumbers: function (string) {
        if (string.length === 0) return {};

        // Create temporary array to parse the string
        let array = string.split("#,#");

        let result = {};

        // Construct dictionary from array
        for (let i = 0; i < array.length; i += 2) {
            result[array[i]] = parseInt(array[i + 1]);
        }

        return result;
    }
};