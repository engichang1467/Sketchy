var chai = require('chai'); 
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should();
chai.use(require('chai-match'));

var supertest = require('supertest');
var randomPictionaryList = require('word-pictionary-list');
var checkWord = require('is-word'); 
word_lang = checkWord('american-english', 'british-english'); 
const fetch = require("node-fetch");


async function getWord() {
	// Getting the wiki link for the first word
	var word = randomPictionaryList(1);
	const word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${word}`)
	const word_data_json = await word_data.json()
	const link = await word_data_json[3][0]

	// Getting the definition for the first word
	const word_def_data = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
	const word_def_data_json = await word_def_data.json()
	const word_def = await word_def_data_json[0]['meanings'][0]['definitions'][0]["definition"]
	// Put into an object
	const output = {word: word[0], definition: word_def, link: link}
	// console.log(output);
	return output;
	
}
async function getWords(word_count){
	words = []
	for (let i = 0; i < word_count; i++) {
		try {
			word = await getWord();
			words.push(word);
			// console.log(word); 
 		} catch {
			// console.log('Error getting word')
			i--;
		}
	}
	return words;
}

async function safeParseJSON(response) {
    const body = await response.text();
    try {
        return JSON.parse(body);
    } catch (err) {
        console.error("Error:", err);
        console.error("Response body:", body);
        // throw err;
        return ReE(response, err.message, 500)
    }
}

describe('Wikipedia API testing', function(done) {
	this.timeout(5000);
	it('Fetching API link: API link successfully fetched and returns content', async () => { 
		random_word = "apple";
		const result = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${random_word}`)
		const result_json = await result.json(); 
		assert.isNotEmpty(result_json); 
		expect(result_json).to.be.an('array'); 
	}); 

	it('Fetching API link: returned array contains a valid Wikipedia link', async () => { 
		random_word = "apple";
		const word_data = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${random_word}`)
		assert.isNotEmpty(word_data); 
		expect(word_data.url).to.match(/en.wikipedia.org/); 
	}); 
});

describe('Random-word-generating function (testing with word_count = 2)', function(done) {
	this.timeout(5000);
    it('Return type: not null', async () => { 
		let word_count = 2;
		var word = await randomPictionaryList(word_count);
        assert.isNotNull(word);
	});
	
	it('Return type: returned words are valid strings', async () => { 
		let word_count = 2; 
		var test = await randomPictionaryList(word_count);
		for(let i = 0; i < word_count; i++) {
			assert.isString(test[i]);
		}	
	});
	it('Return type: returned strings are valid English words', async () => { 
		let word_count = 2; 
		var test = await randomPictionaryList(word_count);
		for(let i = 0; i < word_count; i++) {
			const res = word_lang.check((test[i]).toLowerCase()); 
			assert.isTrue(res); 
		}	
	});
});