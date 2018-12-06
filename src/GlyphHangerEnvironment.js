const chalk = require( "chalk" );
const path = require( "path" );
const fs = require( "fs-extra" );
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const puppeteer = require("puppeteer");
const WebServer = require("./WebServer");
const debugNodes = require("debug")("glyphhanger:nodes");

class EnvironmentScripts {
	constructor() {
		this.charactersetPath = require.resolve("characterset");
		this.glyphhangerPath = path.resolve(__dirname, "../src/glyphhanger-script.js");
	}

	async read() {
		this.characterset = await fs.readFile(this.charactersetPath, "utf-8");
		this.glyphhanger = await fs.readFile(this.glyphhangerPath, "utf-8");
	}
}

class JSDOMEnvironment {
	constructor() {
		this.scripts = new EnvironmentScripts();
	}

	requiresWebServer() {
		return false;
	}

	async getPage(url) {
		let isValidUrl = WebServer.isValidUrl(url);
		let method = isValidUrl ? "fromURL" : "fromFile";
		let options = {
			runScripts: "dangerously",
			// do we want to load subresources? leaving off for now
			// resources: "usable"
		};
		if( !isValidUrl ) {
			// https://github.com/jsdom/jsdom/issues/2304
			options.url = "http://localhost/";
		}

		let domPromise = JSDOM[method](url, options);
		return await domPromise;
	}

	async getResults(page, options) {
		await this.scripts.read();

		let window = page.window;
		let prom = new Promise((resolve, reject) => {
			window.glyphhangerFinish = function(results) {
				resolve(results);
			};
		});

		let script = window.document.createElement("script");
		let injectionString = `${this.scripts.characterset}
${this.scripts.glyphhanger}
let opts = ${JSON.stringify(options)};
if(opts.className && opts.className !== "undefined") {
	// add to both the documentElement and document.body because why not
	document.documentElement.className += " " + opts.className;

	if( "body" in document ) {
		document.body.className += " " + opts.className;
	}
}

var hanger = new GlyphHanger();
hanger.init( document.body, opts );
window.glyphhangerFinish(hanger.toJSON());
`;
		script.innerHTML = injectionString;
		window.document.body.appendChild(script);

		return prom;
	}

	async close() {
		// do nothing
	}
}

class PuppeteerEnvironment {
	requiresWebServer() {
		return true;
	}

	async getBrowser() {
		if( !this.browser ) {
			this.browser = await puppeteer.launch();
		}

		return this.browser;
	}

	async getPage(url) {
		let browser = await this.getBrowser();
		let page = await browser.newPage();
		page.setBypassCSP(true);

		try {
			let response = await page.goto(url, {
				waitUntil: ["load", "networkidle0"],
				timeout: this.timeout
			});

			let statusCode = response.status();

			if ( statusCode !== 200 ) {
				console.log(chalk.yellow(`Warning: ${url} had a non 200 HTTP status code: (${statusCode})`));
			}

			page.on("console", function(msg) {
				debugNodes("(headless browser console): %o", msg.text());
			});

			await page.addScriptTag({
				path: require.resolve("characterset")
			});

			await page.addScriptTag({
				path: path.resolve(__dirname, "../src/glyphhanger-script.js")
			});

			return page;
		} catch(e) {
			console.log(chalk.red(`Error with ${url}:`), e);
		}
	}

	async getResults(page, options) {
		// debugNodes("Full document.body.innerHTML:");
		// debugNodes(await page.evaluate( function() {
		// 	return document.body.innerHTML;
		// }));

		return page.evaluate( function(opts) {
			if(opts.className && opts.className !== "undefined") {
				// add to both the documentElement and document.body because why not
				document.documentElement.className += " " + opts.className;

				if( "body" in document ) {
					document.body.className += " " + opts.className;
				}
			}

			var hanger = new GlyphHanger();
			hanger.init( document.body, opts );

			return hanger.toJSON();
		}, options);
	}

	async close() {
		let browser = await this.getBrowser();
		return await browser.close();
	}
}

class GlyphHangerEnvironment {
	setEnvironment(env) {
		this.envStr = env.toLowerCase();
	}

	get env() {
		if( !this._env ) {
			if(this.envStr === "jsdom") {
				this._env = new JSDOMEnvironment();
			} else {
				this._env = new PuppeteerEnvironment();
			}
		}

		return this._env;
	}

	requiresWebServer() {
		return this.env.requiresWebServer();
	}

	async getPage(url) {
		return this.env.getPage(url);
	}

	async getResults(page, options) {
		return await this.env.getResults(page, options);
	}

	async close() {
		return await this.env.close();
	}
}

module.exports = GlyphHangerEnvironment;