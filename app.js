/*
 * Extenal module Dependencies
 */

var request = require('request')
 ,  cheerio = require('cheerio')
 ,  async 	= require('async')
 ,  fs 		= require('fs');

/*
 * Internal Module Dependencies
 */

var notify  = require('./mailer')
 ,  utils	= require('./utilities')
 ,  config 	= require('./config')['development'];


/*
 * To-do: Move this to the global config
 */

var savedMovies 	= []
  , latestMovies 	= []
  , notifyMovies	= [];

/*
 * Main Process Control
 */

async.waterfall([
	readListingsJson,
	getLatestListings,
	getLatestDifferences,
	notifyLatest, // Expects a Cascade of latest movies
	saveLatestListings 
], function(err) {
	if(err) {
		var message = (err  === true)
						? 'No movie updates found.'
						: 'Global Error: ' + err;

		console.log(message);
	}
	
	console.log('Finished Processing');
});

/*
 * Read the Listings from the File System
 * File Path controlled through the config
 * 
 * @param {function} done - Function to call after the method has processed
 */

function readListingsJson(done) {
	fs.readFile(config.fileName, function(err, data) {
		if (err) { done(err); return; }
		
		// Save the locally stored results
		savedMovies = JSON.parse(data);

		done(null);
	});
}

/*
 * Save the Listings from the File System
 * File Path pulled from the config
 * 
 * @param {function} done - Function to call after the method has processed
 */

function saveLatestListings(done) {
	// No need to save anything if nothing new
	if (latestMovies.length == 0) { done(); return; }

	var saveListings = latestMovies.concat(savedMovies).splice(0, 60);

	fs.writeFile(config.fileName, JSON.stringify(saveListings, null, 4), function(err) {
		if (err) console.log(err);
		else console.log('Saved: ' + config.fileName);

		done();
	});
}

/*
 * Fetches the Latest HD Movies from movies.so
 * 
 * NOTES: Method does too much, break into smaller pieces
 * 
 * @param {function} done - Function to call after the method has processed
 */

function getLatestListings(done) {
	request(config.domain + config.repoUrl, function(error, response, html) {
		if (error) { done(error); return; }

		var $ 			= cheerio.load(html)
		  , listings 	= $('.movie_table li .movie_about_text').toArray();

		async.eachLimit(listings, 4, function(element, innerDone) {
			var $listing 	= $(element)
			  , $header		= $listing.find('h1 a')
			  , title		= $header.text().trim()
			  , link		= $header.attr('href')
			
		  	if (!savedMovies.existsByKey('title', title)) {
		  	  	getMovieInformation(link, function(movie){
		  	  		if (movie) latestMovies.push(movie);

			  		innerDone();
		  	  	});
	  	  	} 
	  	  	else { innerDone(); }
		}, function(err) {
			done(null);
		});
	});
}

/*
 * To-Do: remove
 */

function getLatestDifferences(done) {
	/* 
	 * If the latest differences is 0, we do not need
	 * to process anymore
	 * Passing error = true cancels waterfall
	 */
	if (latestMovies.length == 0) { done(true); return; }

	async.filter(latestMovies, function(movie, callback) {
		callback(!savedMovies.existsByKey('title', movie.title));
	}, function(results) {
		done(null, results);
	});
}

/*
 * Submit email notification of the Latest Listings
 * 
 * @param {array} results - The latest movies
 * @param {function} done - Function to call after the method has processed
 */

function notifyLatest(results, done) {
	if (results.length == 0) { done(); return; } 

	notify.listings({ to: config.mailTo, listings: results}, function(error, message) {
		if (error) { 
			console.log("ERROR:"); 
			console.log(error); 
		}
		else console.log('Email has been sent.');

		done();
	});
	
}

/*
 * Creates a Movie object from the Movie Detail Page
 * 
 * @param {string} link - The movie detail page URL
 * @param {function} done - Function to call after the method has processed
 * 
 * returns {object} movie - New Movie
 */

function getMovieInformation(link, done) {
	request(config.domain + link, function(error, response, html) {

		/*
		 * If the request failed, the method will return null to the caller
		 */

		if (error) { console.log(error); done(null); }
		else if (response.statusCode != 200) { console.log('Server is having an issue.'); done(null); }
		else {
			var movie 	= {}
			  , $ 		= cheerio.load(html);

			if ($ == null) done(null);

			movie.title			= $('.left_page_top > h1').firstInner();
			movie.link			= config.domain + link;
			movie.image			= $('.play_pic img').first().attr('src');
			movie.description 	= $('.description_about').firstInner().replace(/(\r\n|\n|\r)/gm, ' ') // Remove all lines
																	  .replace(/\s+/g, ' ') // Replace all extra spaces 
																	  .trim();

			return done(movie);
		}
	});
}
