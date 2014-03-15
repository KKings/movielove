
var path 			    = require('path')
  , rootPath		  = path.normalize(__dirname + '/..')
  , templatePath	= path.normalize(__dirname + '/../mailer/templates')
  , domain        = 'http://www.movie25.so'
  , repoUrl       = '/latest-hd-movies/'
  , fileName      = 'listings.json' 
  , mailTo        = '';


var mailer = {
    //service: "Gmail",
    auth: {
        user: "",
        pass: ""
}};

module.exports = {
	development: {
		root: rootPath,
		templatePath: templatePath,
		mailer: mailer,
    fileName: fileName,
    repoUrl: repoUrl,
    domain: domain,
    mailTo: mailTo
	}
}