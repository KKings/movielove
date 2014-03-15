
/*
 * Module Dependencies
 */

var cheerio = require('cheerio')


/*
 * Utility Extension to grab the First Text found
 * from the 'Cheerio' object
 */

cheerio.prototype.firstInner = function() {
	if (this == null) return '';
	else if (this.length == 1) return this.text();

	return this.first().text();
}

/*
 * Utility Extension to look into an array
 * of objects by key to determine if it exists already
 */

Array.prototype.existsByKey = function(key, val) {
	var exists = this.map(function(obj) { return obj[key] }).indexOf(val) != -1;
	console.log('Does \'' + val + '\' exist? ' + exists);
	return exists;
}