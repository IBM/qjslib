[![Build Status](https://github.com/ibm/qjslib/workflows/build/badge.svg)](https://github.com/ibm/qjslib/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=qjslib&metric=alert_status)](https://sonarcloud.io/dashboard?id=qjslib)
# QRadar App JavaScript Library (qjslib)
QJSLib is a JavaScript utility library that provides functionality for QRadar apps to simplify interactions with QRadar.
* [LICENSE](LICENSE)
* [CONTRIBUTING](CONTRIBUTING.md)
* [MAINTAINERS](MAINTAINERS.md)
* [CHANGELOG](https://github.com/IBM/qjslib/releases)
* [DOCUMENTATION](https://github.com/IBM/qjslib/wiki/qappfw)

## How to use
### Browser vs module
The build process for this project generates two separate files in *lib/*.

*qappfw.js* is not minified. It is designed to be bundled with your application code.

*qappfw.min.js* is minified with polyfills for browser compatibility. It is designed to be used directly in the browser.

### As a module

1. Install `qjslib`.
```
npm i qjslib
```
2. Import it into your application.
```
import { QRadar } from "qjslib";
```
3. You can now use the helper functions.
```
QRadar.fetch("/api/gui_app_framework/applications")
    .then((response) => response.json())
    .then((json) => console.log(json));
```

### As a browser script
1. Get the [latest release of QJSLib](https://github.com/IBM/qjslib/releases).
2. Download the latest tarball *qjslib-(version).tgz*.
3. Extract *package/lib/qappfw.min.js*.
4. Place this file in your QRadar app, e.g. in */app/static/qappfw.min.js*
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
