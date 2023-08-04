import webpack from "webpack";
import { fileURLToPath } from "url";
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
	return {
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
			static: path.join(__dirname, "dist"),
			host: "127.0.0.1",
			port: 8080,
			hot: true,
			open: true,
		},
		watchOptions: {
			// File watching doesn't always work on Windows, so we fall back to polling
			poll: 1000,
		},
		plugins: [
			new HtmlWebpackPlugin({
				inject: "head",
				template: path.join(__dirname, "client", "index.html"),
			}),
			new webpack.DefinePlugin({
				"process.env.RIVET_TOKEN": env.production
					? "undefined"
					: JSON.stringify(process.env.RIVET_TOKEN),
			}),
		],
	};
};
