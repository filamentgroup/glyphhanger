const SpiderPig = require("@zachleat/spider-pig");

class MultipleSpiderPig {
	constructor() {
		this.limit = 10;
		this.urls = [];
		this.isVerbose = false;
	}

	async getPiggy() {
		if( !this.piggy ) {
			this.piggy = new SpiderPig();
			await this.piggy.start();
		}

		return this.piggy;
	}

	setVerbose(isVerbose) {
		this.isVerbose = !!isVerbose;
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
			this.addUrls(await piggy.fetchLocalUrls(url));
		}
	}

	getUrlsWithLimit() {
		let urls = this.urls;

		if( this.limit ) {
			urls = this.urls.slice(0, this.limit );
		}

		if( this.isVerbose ) {
			urls.forEach(function( url, index ) {
				console.log( "glyphhanger found (" + ( index + 1 ) + "): " + url );
			});
		}

		return urls;
	}

	async finish() {
		if( this.piggy ) {
			await this.piggy.finish();
		}
	}
}

module.exports = MultipleSpiderPig;