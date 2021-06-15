const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
    entry: {
        client: path.join(__dirname, "client", "index.ts"),
    },
    output: {
        path: path.join(__dirname, "dist"),
    },
    mode: "development",
    context: path.join(__dirname, "client"),
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.png/,
                type: "asset/resource",
            },
        ],
    },
    devtool: "inline-source-map",
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        port: 8080,
        sockPort: 8081,
        hot: true,
        overlay: true,
        open: true,
    },
    watchOptions: {
        // File watching doesn't always work on Windows, so we fall back to polling
        poll: 1000,
    },
    plugins: [
        new Dotenv(),
        new HtmlWebpackPlugin({
            inject: "head",
            template: path.join(__dirname, "client", "index.html"),
        }),
    ],
};
