
/*
 * Module Depencies
 */

var mailer 		= require('nodemailer')
 ,  templater	= require('email-templates')
 ,  config	 	= require('../config/index')['development'];

mailer.sendemail = true;

var transport	= mailer.createTransport("SMTP", config.mailer);

/*
 * Notification Object
 */

var Notify = {
	listings: function(options, done) {
		var to 			= options.to
		 ,  from		= config.auth.user
		 ,  listings	= options.listings
		 ,  locals		= { listings: listings };

	 	templater(config.templatePath, function(error, template) {
	 		if (error) { console.log(error); done(error); }
	 		else {
	 			template('email', locals, function(error, html, text) {
	 				if (error) { console.log(error); done(); }
	 				else {
					 	var obj = {
					 		to: to,
					 		from: from,
					 		subject: options.listings.length + ' New Movies Available',
					 		html: html,
					 		text: text
					 	};

		 				transport.sendMail(obj, function(error, response) {
		 					transport.close();
		 					done(error); // Returns null if no error
		 				});
		 			}
	 			})
	 		}
	 	})
	}
}

module.exports = Notify;
