const chalk = require( "chalk" );
const path = require( "path" );
const puppeteer = require('puppeteer');
const CharacterSet = require( "characterset" );
const WebServer = require( "./WebServer" );
const GlyphHangerWhitelist = require( "./GlyphHangerWhitelist" );
const debug = require("debug")("glyphhanger");
const debugNodes = require("debug")("glyphhanger:nodes");

class GlyphHanger {
	constructor() {
		this.sets = {
			"*": new CharacterSet()
		};

		this.whitelist = new GlyphHangerWhitelist();
	}

	async getBrowser() {
		if( !this.browser ) {
			this.browser = await puppeteer.launch();
		}

		return this.browser;
	}

	setSubset( subset ) {
		this.subset = !!subset;
	}

	setFamilies( families ) {
		this.families = families;
	}

	setJson( outputJson ) {
		this.outputJson = !!outputJson;
	}

	setClassName( classname ) {
		this.className = classname;
	}

	setUnicodesOutput( showString ) {
		this.unicodes = !showString;
	}

	getIsCodePoints() {
		return this.subset ? true : this.unicodes;
	}

	setWhitelist( whitelistObj ) {
		this.whitelist = whitelistObj;

		this.sets["*"] = this.sets["*"].union( this.whitelist.getCharacterSet() );
	}

	addToSets( results ) {
		for( var family in results ) {
			if( !( family in this.sets ) ) {
				this.sets[family] = new CharacterSet();
				this.sets[family] = this.sets[family].union( this.whitelist.getCharacterSet() );
			}

			this.sets[family].add.apply( this.sets[family], results[family] );
		}
	}

	getSets() {
		return this.sets;
	}

	getUniversalSet() {
		return this.sets['*'];
	};

	getSetForFamilies(families) {
		if( typeof families === "string" ) {
			families = families.split(",").map(family => family.trim());
		}

		// case insensitive map
		let familyMap = {};
		for( let familyName of families ) {
			familyMap[familyName.toLowerCase()] = true;
		}

		let set = new CharacterSet();
		for( let family in this.sets ) {
			if(familyMap[family.toLowerCase()]) {
				set = set.union( this.sets[family] );
			}
		}

		set = set.union( this.whitelist.getCharacterSet() );

		return set;
	}

	async _getPage(url) {
		let browser = await this.getBrowser();
		let page = await browser.newPage();

		await page.goto(url, {
			waitUntil: ["load", "networkidle0"]
		});

		return page;
	}

	async _fetchUrl( url ) {
		debug( "requesting: %o", url );

		let page = await this._getPage(url);

		page.on("console", function(msg) {
			debugNodes("(headless browser console): %o", msg.text());
		});

		await page.addScriptTag({
			path: path.resolve(__dirname, "../node_modules/characterset/lib/characterset.js")
		});

		await page.addScriptTag({
			path: path.resolve(__dirname, "../src/glyphhanger-script.js")
		});

		let json = await page.evaluate( function(docClassName) {
			if(docClassName && docClassName !== "undefined") {
				// add to both the documentElement and document.body because why not
				document.documentElement.className += " " + docClassName;

				if( "body" in document ) {
					document.body.className += " " + docClassName;
				}
			}

			var hanger = new GlyphHanger();
			hanger.init( document.body );

			return hanger.toJSON();
		}, this.className);

		debug("Adding to set for %o: %o", url, json);
		this.addToSets(json);
	}

	async fetchUrls( urls ) {
		for( let url of urls ) {
			debug("WebServer.isValidUrl(%o)", url);

			if(!WebServer.isValidUrl(url) || url.indexOf('http://localhost:') === 0 ) {
				if( !this.staticServer ) {
					debug("Creating static server");
					this.staticServer = await WebServer.getStaticServer();
				}
			}

			let urlStr = WebServer.getUrl(url);
			await this._fetchUrl(urlStr);
		}

		let browser = await this.getBrowser();
		await browser.close();

		debug("maybe closing static server");
		WebServer.close(this.staticServer);
	}

	getOutputForSet(set) {
		if( this.getIsCodePoints() ) {
			return set.toHexRangeString();
		} else {
			return set.toArray().map(function( code ) {
				return String.fromCharCode( code );
			}).join('');
		}
	}

	getActiveSet() {
		let set = this.sets['*'];
		if( this.families && this.families !== true ) {
			set = this.getSetForFamilies(this.families);
		}
		return set;
	}

	getUnicodeRange() {
		return this.getActiveSet().toHexRangeString();
	}

	outputUnicodes() {
		console.log( this.unicodes ? this.whitelist.getWhitelistAsUnicodes() : this.whitelist.getWhitelist() );
	}

	output() {
		var outputStr = [];

		if( this.outputJson || this.families === true ) {
			// JSON format
			var jsonLines = [];
			for( var family in this.sets ) {
				jsonLines.push("\"" + family + "\": \"" + this.getOutputForSet( this.sets[family] ) + "\"");
			}
			outputStr.push("{" + jsonLines.join(",") + "}");
		} else {
			let activeSet = this.getActiveSet();
			// output the combined universal set
			outputStr.push( this.getOutputForSet( activeSet ) );
		}

		console.log( outputStr.join("\n") );	
	}

	outputHelp() {
		var out = [];

		out.push( chalk.red( "glyphhanger error: requires at least one URL or whitelist." ) );
		out.push( "" );
		out.push( "usage: glyphhanger ./test.html" );
		out.push( "       glyphhanger http://example.com" );
		out.push( "       glyphhanger https://google.com https://www.filamentgroup.com" );
		out.push( "       glyphhanger http://example.com --subset=*.ttf" );
		out.push( "       glyphhanger --whitelist=abcdef --subset=*.ttf" );
		out.push( "" );
		out.push( "arguments: " );
		out.push( "  --version" );
		out.push( "  --whitelist=abcdef" );
		out.push( "       A list of whitelist characters (optionally also --US_ASCII)." );
		out.push( "  --string" );
		out.push( "       Output the actual characters instead of Unicode code point values." );
		out.push( "  --family='Lato,monospace'" );
		out.push( "       Show only results matching one or more font-family names (comma separated, case insensitive)." );
		out.push( "  --json" );
		out.push( "       Show detailed JSON results (including per font-family glyphs for results)." );
		out.push( "  --css" );
		out.push( "       Output a @font-face block for the current data." );
		out.push( "  --subset=*.ttf" );
		out.push( "       Automatically subsets one or more font files using fonttools `pyftsubset`." );
		out.push( "  --formats=ttf,woff,woff2,woff-zopfli" );
		out.push( "       woff2 requires brotli, woff-zopfli requires zopfli, installation instructions: https://github.com/filamentgroup/glyphhanger#installing-pyftsubset" );
		out.push( "" );
		out.push( "  --spider" );
		out.push( "       Gather local URLs from the main page and navigate those URLs." );
		out.push( "  --spider-limit=10" );
		out.push( "       Maximum number of URLs gathered from the spider (default: 10, use 0 to ignore)." );
		console.log( out.join( "\n" ) );
	}
}

module.exports = GlyphHanger;