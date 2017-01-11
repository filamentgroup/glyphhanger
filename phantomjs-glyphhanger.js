"use strict";
var webpage = require( "webpage" );
var GlyphHanger = require( "./glyphhanger.js" );
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
			if ( status === "success" && page.injectJs( "glyphhanger.js" ) ) {
				resolve( page.evaluate( function() {

					var hanger = new GlyphHanger();
					hanger.init( document.body );

					return hanger.getGlyphs().join( "" );
				}) );
			} else {
				reject( url, status );
			}
		});
	});
}

var combined = new GlyphHanger();
var promises = [];

// Remove the script name argument
args.shift();

// Verbose

var isVerbose = args.shift() === "true";

// Whitelist
combined.saveGlyphs( args.shift() );

// Add URLS
args.forEach(function( url ) {
	promises.push( requestUrl( url ) );
	if( isVerbose ) {
		console.log( pluginName + " requesting:", url );
	}
});

Rsvp.all( promises ).then( function( results ) {
	results.forEach( combined.saveGlyphs.bind( combined ) );

	if( isVerbose ) {
		console.log( pluginName + " output:" );
	}
	console.log( combined.getGlyphs().join( "" ) );

	phantom.exit( 0 );
}).catch(function( error ) {
	console.log( pluginName + " error: ", error );

	phantom.exit( 1 );
});