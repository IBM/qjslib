var path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/qappfw.js",
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "qappfw.js",
        library: "qappfw",
        libraryTarget: "umd"
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    }
};
