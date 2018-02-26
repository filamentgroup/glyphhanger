const WebServer = require("./WebServer");
const SpiderPig = require("@zachleat/spider-pig");
const debug = require("debug")("glyphhanger");
const debugSpiderPig = require("debug")("glyphhanger:spiderpig");

class MultipleSpiderPig {
	constructor() {
		this.limit = 10;
		this.urls = [];
	}

	async getPiggy() {
		if( !this.piggy ) {
			this.piggy = new SpiderPig();
			await this.piggy.start();
		}

		return this.piggy;
	}

	setLimit(newLimit) {
		if(newLimit === true) {
			// keep default 10
		} else if( newLimit ) {
			this.limit = parseInt(newLimit, 10);
		} else if( newLimit === 0 ) {
			// no limit
			this.limit = false;
		}
	}

	async addUrls(urls) {
		this.urls = this.urls.concat(urls);
	}

	async fetchUrls(urls) {
		let piggy = await this.getPiggy();

		for( let url of urls ) {
			if(!WebServer.isValidUrl(url)) {
				if( !this.staticServer ) {
					debugSpiderPig("Creating static server");
					this.staticServer = await WebServer.getStaticServer();
				}
			}
			url = WebServer.getUrl(url);

			debug("fetching %o", url);
			this.addUrls([url]);
			this.addUrls(await piggy.fetchLocalUrls(url));
		}

		debugSpiderPig("Closing static server");
		WebServer.close(this.staticServer);
	}

	getUrlsWithLimit() {
		let urls = this.urls;

		if( this.limit ) {
			urls = this.urls.slice(0, this.limit );
		}

		urls.forEach(function( url, index ) {
			debug( "Found (" + ( index + 1 ) + "): " + url );
		});

		return urls;
	}

	async finish() {
		if( this.piggy ) {
			debugSpiderPig("finishing");
			await this.piggy.finish();
		}
	}
}

module.exports = MultipleSpiderPig;