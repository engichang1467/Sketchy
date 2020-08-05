var chai = require('chai'); 
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should();
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

describe('Wikipedia API testing', function(done){
	it('Fetching API link: API link successfully fetched and returns content', async () => { 
		const result = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${random_word}`)
		const result_json = await result.json(); 
		assert.isNotNull(result_json); 
		expect(result_json).to.be.an('array'); 
	}); 
	it('Fetching API link: returned array contains a valid Wikipedia link', async () => { 
		const result = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${random_word}`)
		const result_json = await result.json(); 
		expect(result_json).to.match(/en.wikipedia.org/); 
	}); 
});

describe('Random-word-generating function', function(done) {
    it('Return type: not null', async () => { 
        const result = await getRandomWords(3);
        assert.isNotNull(result);
	});
	it('Return type: array (of 3 random words to select from)', async () => { 
		const result = await getRandomWords(3);
		assert.isArray(result);
		assert.lengthOf(result, 3);
	});
});



