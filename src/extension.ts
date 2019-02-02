// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Authorizer from './util/Authorizer';
import Initialize from './util/Initialize';
import HatenaBlogUtil from './util/HatenaBlogUtil';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const hatena = new HatenaBlogUtil();
	const initialize = new Initialize();

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "post2hatenablog" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposables = [];

	//テンプレートフォルダの生成
	const init = () => {
		initialize.createWorkingDirectory();
	};
	disposables.push(vscode.commands.registerCommand('extension.init', init));

	//Start Authorize
	const startOauth = async () => {
		await Authorizer.getInstance().startOAuth();
	};
	disposables.push(vscode.commands.registerCommand('extension.startOAuth', startOauth));

	const getMember = () => {
		const inputBoxOptions: vscode.InputBoxOptions = {
			prompt: "Input Hatena Blog ID.",
			placeHolder: "UNIX epoch"
		};
		
		vscode.window.showInputBox(inputBoxOptions).then(async (value) => {
			if (value !== undefined){
				await hatena.getMember(value);
			}
		});
	};
	disposables.push(vscode.commands.registerCommand('extension.getMember', getMember));

	const getCategory = async () => {
		await hatena.getCategory();
	};
	disposables.push(vscode.commands.registerCommand('extension.getCategory', getCategory));

	const getServiceXml = async () => {
		await hatena.getServiceXml();
	};
	disposables.push(vscode.commands.registerCommand('extension.getServiceXml', getServiceXml));

	const getCollection = async () => {
		await hatena.getCollection();
	};
	disposables.push(vscode.commands.registerCommand('extension.getCollection', getCollection));


	context.subscriptions.concat(disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
