[![Build Status](https://travis-ci.com/IBM/qjslib.svg?branch=master)](https://travis-ci.com/IBM/qjslib)
# QRadar App JavaScript Library (qjslib)
QJSLib is a JavaScript utility library that provides functionality for QRadar apps to simplify interactions with QRadar.
* [LICENSE](LICENSE)
* [CONTRIBUTING](CONTRIBUTING.md)
* [MAINTAINERS](MAINTAINERS.md)
* [CHANGELOG](CHANGELOG.md)

## How to use
### As a browser script
1. Get the [latest release of QJSLib](https://github.com/IBM/qjslib/releases). 
2. Download the latest tarball. 
3. Extract *lib/qappfw.js*.
4. Place this file in your QRadar app, e.g. in */app/static/qappfw.js*
5. Add a reference to the file from your HTML file.
6. The utility class QRadar is added to the global scope - and can be accessed through `window.qappfw.QRadar`.
7. It may be easier to include somewhere in your scripts `const QRadar = window.qappfw.QRadar` to aid in readability.

## Developing this project
See setup in [CONTRIBUTING](CONTRIBUTING.md#Setup)
