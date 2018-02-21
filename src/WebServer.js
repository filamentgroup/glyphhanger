const connect = require("connect");
const serveStatic = require("serve-static");
const path = require( "path" );
const { URL } = require("url");
const debug = require("debug")("glyphhanger:webserver");

const SITE_PATH = path.resolve(__dirname, "..");
const SERVER_PORT = 8093;

class WebServer {
	static isValidUrl(url) {
		try {
			new URL(url);
			return true;
		} catch(e) {
			return false;
		}
	}

	static getUrl(urlStr) {
		let urlObj;
		if( WebServer.isValidUrl(urlStr)) {
			urlObj = new URL(urlStr);
		} else {
			urlObj = new URL(urlStr, "http://localhost:" + SERVER_PORT + "/");
			debug("Transforming %o to new URL %o", urlStr, urlObj.toString());
		}
		return urlObj.toString();
	}

	static getStaticServer() {
		let port = SERVER_PORT;
		return new Promise(function(resolve, reject) {
			let server = connect().use(serveStatic(SITE_PATH)).listen(port, function() {
				debug(`Web server started on ${port} for ${SITE_PATH}.`);
				resolve(server);
			});
		});
	}

	static close(server) {
		if( server ) {
			if( server instanceof Promise ) {
				server.then(function(serverInst) {
					debug('Closing web server');
					serverInst.close();
				})
			} else {
				debug('Closing web server');
				server.close();
			}
		}
	}
}

module.exports = WebServer;