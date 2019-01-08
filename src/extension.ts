// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as HatenaBlogUtil from './util/HatenaBlogUtil';
import * as Initialize from './util/Initialize';
import { isNumber } from 'util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const hatena = new HatenaBlogUtil.HatenaBlogUtil();
	const initialize = new Initialize.Initialize();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "post2hatenablog" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposables = [];

	//テンプレートフォルダの生成
	const init = () => {
		initialize.createDirectory();
	};
	disposables.push(vscode.commands.registerCommand('extension.init', init));

	//Start Authorize
	const startOauth = async () => {
		await hatena.startOAuth();
	};
	disposables.push(vscode.commands.registerCommand('extension.startOAuth', startOauth));

	//Get Blog
	const getBlog = () => {
		vscode.window.showInputBox().then(async (value) => {
			await hatena.getBlog(value);
		});
	};
	disposables.push(vscode.commands.registerCommand('extension.getBlog', getBlog));

	//Post Blog
	const postBlog = async () => {
		await hatena.postBlog();
	};
	disposables.push(vscode.commands.registerCommand('extension.postBlog', postBlog));

	context.subscriptions.concat(disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
