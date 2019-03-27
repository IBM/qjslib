[![Build Status](https://travis-ci.com/IBM/qjslib.svg?branch=master)](https://travis-ci.com/IBM/qjslib)
# QRadar App JavaScript Library (qjslib)
QJSLib is a JavaScript utility library that provides functionality for QRadar apps to simplify interactions with QRadar.
* [LICENSE](LICENSE)
* [CONTRIBUTING](CONTRIBUTING.md)
* [MAINTAINERS](MAINTAINERS.md)
* [CHANGELOG](CHANGELOG.md)

## How to use
### Browser vs Module
The build process for this project generates two seperate *qappfw.js* files, one in *build/* and one in *lib/*. 

The file in *build/* contains a number of polyfills and is minified to ensure compatability with older browsers, and as such is suitable for direct use from the browser. 

The file in *lib/* is smaller and not minified, with less polyfills - this is intended for use as an imported module; keep in mind that if you want to ensure compatability with older versions of browsers your build process must include polyfills that this module does not have.
### As a browser script
1. Get the [latest release of QJSLib](https://github.com/IBM/qjslib/releases). 
2. Download the latest tarball. 
3. Extract *build/qappfw.js*.
4. Place this file in your QRadar app, e.g. in */app/static/qappfw.js*
5. Add a reference to the file from your HTML file.
6. The utility class QRadar is added to the global scope - and can be accessed through `window.qappfw.QRadar`.
7. You can now use *qjslib* like this:
```
const QRadar = window.qappfw.QRadar

// Using traditional xmlhttprequest callback
QRadar.rest({
	path: "/api/gui_app_framework/applications",
	onComplete: function() {console.log(this.response);},
	httpMethod: "GET"
});

// Using modern promise based fetch
// Not using arrow functions for older browser compatability
QRadar.fetch("/api/gui_app_framework/applications")
	.then(function(response) {return response.json();})
	.then(function(json) {console.log(json);});

console.log(QRadar.getWindowOrigin());
```

## Developing this project
See setup in [CONTRIBUTING](CONTRIBUTING.md#Setup)
