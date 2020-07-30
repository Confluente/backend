var assert = require("assert");

var dictionaryHelper = require("../../helpers/dictionaryHelper");

describe("dictionaryHelper", function () {

    describe("#dictionaryOfStrings", function () {
        let sampleDictionary = {
            "Hello": "World",
            "This test is": "Amazing!",
            "Hopefully it": "WORKS!"
        }

        let string = dictionaryHelper.stringifyDictionaryOfStrings(sampleDictionary);
        let result = dictionaryHelper.destringifyStringifiedDictionaryOfStrings(string)

        it("check equality original and translated objects", function () {
            assert(result["Hello"] === "World");
            assert(result["This test is"] === "Amazing!");
            assert(result["Hopefully it"] === "WORKS!");
            return true;
        })
    });

    describe("#dictionaryOfNumbers", function () {
        let sampleDictionary = {
            "Version": 1,
            "Awesome web committee": 1,
            "Cares given": 9000
        }

        let string = dictionaryHelper.stringifyDictionaryOfNumbers(sampleDictionary);
        let result = dictionaryHelper.destringifyStringifiedDictionaryOfNumbers(string)

        it("check equality original and translated objects", function () {
            assert(result["Version"] === 1);
            assert(result["Awesome web committee"] === 1);
            assert(result["Cares given"] === 9000);
            return true;
        })
    });

    describe("#dictionaryOfBooleans", function () {
        let sampleDictionary = {
            "True": true,
            "False": false,
            "Are we the best committee?": true
        }

        let string = dictionaryHelper.stringifyDictionaryOfBooleans(sampleDictionary);
        let result = dictionaryHelper.destringifyStringifiedDictionaryOfBooleans(string)

        it("check equality original and translated objects", function () {
            assert(result["True"] === true);
            assert(result["False"] === false);
            assert(result["Are we the best committee?"] === true);
            return true;
        })
    });
});
