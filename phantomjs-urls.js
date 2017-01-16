"use strict";
var webpage = require( "webpage" );
var GlyphHanger = require( "./glyphhanger.js" );
var Rsvp = require( "rsvp" );
var args = require( "system" ).args;

var pluginName = "glyphhanger-spider";

function spiderForUrls( url ) {
	var page = webpage.create();

	// Careful with this, we rely on stdout for return data in index.js
	// page.onConsoleMessage = function( msg ) {
	// 	console.log( pluginName + " phantom console:", msg );
	// };

	return new Rsvp.Promise(function( resolve, reject ) {
		page.open( url, function( status ) {
			if ( status === "success" && page.injectJs( "glyphhanger-spider.js" ) ) {
				resolve( page.evaluate( function() {
					var ghs = new GlyphHangerSpider();
					ghs.parse( document.body );

					return ghs.getUrls();
				}));
			} else {
				reject( url, status );
			}
		});
	});
}

var promises = [];

// Remove the script name argument
args.shift();

// The remaining arguments are urls
args.forEach(function( url ) {
	promises.push( spiderForUrls( url ) );
});

Rsvp.all( promises ).then( function( results ) {
	var urls = [];

	results.forEach(function( result ) {
		urls = urls.concat( result );
	});

	console.log( urls.join( "\n" ) );

	phantom.exit( 0 );
}).catch(function( error ) {
	console.log( pluginName + " error: ", error );

	phantom.exit( 1 );
});