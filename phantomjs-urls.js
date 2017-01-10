"use strict";
var webpage = require( "webpage" );
var GlyphHanger = require( "./logger.js" );
var Rsvp = require( "rsvp" );
var args = require( "system" ).args;

var pluginName = "glyphhanger-spider";

function spiderForUrls( url ) {
	var page = webpage.create();

	return new Rsvp.Promise(function( resolve, reject ) {
		page.open( url, function( status ) {
			if ( status === "success" ) {
				resolve( page.evaluate( function() {
					function normalizeURL( url ) {
						var a = document.createElement( "a" );
						a.href = url;
						return a.href;
					}

					var urls = [];

					Array.prototype.slice.call( document.querySelectorAll( "a[href]" ) ).forEach(function( node ) {
						var url = normalizeURL( node.getAttribute( "href" ) );

						// Local URLs only
						if( url.indexOf( location.host ) > -1 ) {
							urls.push( url );
						}
					});

					return urls;
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

args.forEach(function( url ) {
	promises.push( spiderForUrls( url ) );
});

Rsvp.all( promises ).then( function( results ) {
	console.log( results.map(function( result ) {
		return result.join( "\n" );
	}).join( "\n" ) );

	phantom.exit( 0 );
}).catch(function( error ) {
	console.log( pluginName + " error: ", error );

	phantom.exit( 1 );
});