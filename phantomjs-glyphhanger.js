"use strict";
var webpage = require( "webpage" );
var CharacterSet = require( "characterset" );
var Rsvp = require( "rsvp" );
var args = require( "system" ).args;

var pluginName = "glyphhanger";

function requestUrl( url ) {
	var page = webpage.create();

	page.onConsoleMessage = function( msg ) {
		console.log( pluginName + " phantom console:", msg );
	};

	return new Rsvp.Promise(function( resolve, reject ) {
		page.open( url, function( status ) {
			if ( status === "success" && page.injectJs( "node_modules/characterset/lib/characterset.js" ) && page.injectJs( "glyphhanger.js" ) ) {
				resolve( page.evaluate( function() {

					var hanger = new GlyphHanger();
					hanger.init( document.body );

					return hanger.getGlyphs();
				}) );
			} else {
				reject( url, status );
			}
		});
	});
}

var combined = new CharacterSet();
var promises = [];

/*
 *Arguments List

 1. script name
 2. isVerbose ("true" or "false")
 3. output unicodes
 4. whitelisted characters
 5 and up. urls
*/

// Remove the script name argument
args.shift();

// Verbose
var isVerbose = args.shift() === "true";

// Output code points
var isCodePoints = args.shift() === "true";

// Whitelist
var whitelist = args.shift();
if( whitelist.length ) {
	combined = combined.union( new CharacterSet( whitelist ) );
}

// Add URLS
args.forEach(function( url ) {
	promises.push( requestUrl( url ) );
	if( isVerbose ) {
		console.log( pluginName + " requesting:", url );
	}
});

Rsvp.all( promises ).then( function( results ) {
	results.forEach( function( result ) {
		combined.add.apply( combined, result );
	});

	if( isVerbose ) {
		console.log( pluginName + " output (" + combined.getSize() + "):" );
	}

	if( isCodePoints ) {
		console.log( combined.toArray().map(function( code ) {
				return 'U+' + code.toString(16);
			}).join(',') );
	} else {
		console.log( combined.toArray().map(function( code ) {
				return String.fromCharCode( code );
			}).join('') );
	}

	phantom.exit( 0 );
}).catch(function( error ) {
	console.log( pluginName + " error: ", error );

	phantom.exit( 1 );
});