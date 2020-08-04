var chai = require('chai'); 
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should();
const asserttype = require('chai-asserttype');
chai.use(asserttype);
var supertest = require('supertest');

const wordListPath = require('word-list');
const fs = require('fs');
const fetch = require("node-fetch");
const wordArray = fs.readFileSync(wordListPath, 'utf8').split('\n'); 

async function getRandomWords(word_count) {
	words = []
	for (let i = 0; i < word_count; i++) {
		var n = Math.floor(Math.random() * Math.floor(wordArray.length - 1));
		random_word = wordArray[n]
		let word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${random_word}`);
		let word_data_json = await word_data.json();
		let word = {word: random_word, link: word_data_json[3][0]}		
		words.push(word)
	}
	return words;
}

describe('Random-word-generating function', function(done) {
    it('Return type', async () => { 
        const result = await getRandomWords(3);
        assert.isNotNull(result)
    });
});



