"use strict";
var webpage = require( "webpage" );
var CharacterSet = require( "characterset" );
var Rsvp = require( "rsvp" );
var args = require( "system" ).args;

var pluginName = "glyphhanger";

function requestUrl( url, documentClassName ) {
	return new Rsvp.Promise(function( resolve, reject ) {
		var page = webpage.create();

		page.onConsoleMessage = function( msg ) {
			console.log( pluginName + " phantom console:", msg );
		};

		page.onLoadFinished = function( status ) {
			if( status !== "success" ) {
				reject( "onLoadFinished error", status );
			}

			if( page.injectJs( "node_modules/characterset/lib/characterset.js" ) &&
					page.injectJs( "glyphhanger.js" ) ) {

				var json = page.evaluate( function(docClassName) {
					if(docClassName) {
						// add to both the documentElement and document.body because why not
						document.documentElement.className += " " + docClassName;
						document.body.className += " " + docClassName;
					}

					var hanger = new GlyphHanger();
					hanger.init( document.body );

					return hanger.toJSONString();
				}, documentClassName);

				resolve( JSON.parse(json) );
			} else {
				reject( "injectJs error" );
			}
		};

		page.open( url, function( status ) {
			if( status !== "success" ) {
				reject( url, status );
			}
		});
	});
}

var combinedSets = {
	"*": new CharacterSet()
};
var promises = [];

/*
 *Arguments List

 1. script name
 2. isVerbose ("true" or "false")
 3. output unicodes
 4. whitelisted characters
 5. show output per font-family
 6. classname to add to document to force font-families
 7 and up. urls
*/

// Remove the script name argument
args.shift();

// Verbose
var isVerbose = args.shift() === "true";

// Output code points
var isCodePoints = args.shift() === "true";

// Whitelist
var whitelist = args.shift();
var whitelistSet = new CharacterSet();
if( whitelist.length ) {
	whitelistSet = CharacterSet.parseUnicodeRange( whitelist );
}

var outputJson = args.shift() === "true";

var documentClassName = args.shift();

// Add URLS
args.forEach(function( url ) {
	promises.push( requestUrl( url, documentClassName ) );
	if( isVerbose ) {
		console.log( pluginName + " requesting:", url );
	}
});

function getOutputForSet(set, isCodePoints) {
	if( isCodePoints ) {
		return set.toHexRangeString();
	} else {
		return set.toArray().map(function( code ) {
			return String.fromCharCode( code );
		}).join('');
	}
}

Rsvp.all( promises ).then( function( results ) {
	results.forEach( function( result ) {
		for( var family in result ) {
			if( !( family in combinedSets ) ) {
				combinedSets[family] = new CharacterSet();
				combinedSets[family] = combinedSets[family].union( whitelistSet );
			}
			combinedSets[family].add.apply( combinedSets[family], result[family] );
		}
	});

	var outputStr = [];
	if( isVerbose ) {
		console.log( pluginName + " output:" );
	}

	if( outputJson ) {
		// JSON format
		var jsonLines = [];
		for( var family in combinedSets ) {
			jsonLines.push("\"" + family + "\": \"" + getOutputForSet( combinedSets[family], isCodePoints ) + "\"");
		}
		outputStr.push("{" + jsonLines.join(",") + "}");
	} else if( isVerbose ) {
		// output each family set individually, but not in json format
		for( var family in combinedSets ) {
			var glyphCount = combinedSets[family].getSize();
			var familyStr = [];
			familyStr.push( "font-family: " + family + ", " + glyphCount + " glyph" + (glyphCount !== 1 ? 's' : '') );
			familyStr.push( getOutputForSet( combinedSets[family], isCodePoints ) );

			outputStr.push(familyStr.join(": "));
		}
	} else {
		// output the combined universal set
		outputStr.push( getOutputForSet( combinedSets['*'], isCodePoints ) );
	}
	console.log( outputStr.join("\n") );	


	phantom.exit( 0 );
}).catch(function( error ) {
	console.log( pluginName + " error: ", error );

	phantom.exit( 1 );
});