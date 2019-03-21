// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Authorizer from './util/Authorizer';
import Initialize from './util/Initialize';
import HatenaBlogUtil from './util/HatenaBlogUtil';
import Converter from './Converter';

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
  const disposables: vscode.Disposable[] = [];

  //テンプレートフォルダの生成
  const init = () => {
    initialize.createWorkingDirectory();
  };
  disposables.push(vscode.commands.registerCommand('extension.init', init));

  //Start Authorize
  const startOauth = () => {
    Authorizer.getInstance().startOAuth();
  };
  disposables.push(vscode.commands.registerCommand('extension.startOAuth', startOauth));

  const getMember = () => {
    const inputBoxOptions: vscode.InputBoxOptions = {
      prompt: "Input Hatena Blog ID.",
      placeHolder: "data-uuid"
    };
    
    vscode.window.showInputBox(inputBoxOptions).then(value => {
      if (value !== undefined){
        hatena.getMember(value);
      }
    });
  };
  disposables.push(vscode.commands.registerCommand('extension.getMember', getMember));

  const getCategory = () => {
    hatena.getCategory();
  };
  disposables.push(vscode.commands.registerCommand('extension.getCategory', getCategory));

  const getServiceXml = () => {
    hatena.getServiceXml();
  };
  disposables.push(vscode.commands.registerCommand('extension.getServiceXml', getServiceXml));

  const getCollection = () => {
    hatena.getCollection();
  };
  disposables.push(vscode.commands.registerCommand('extension.getCollection', getCollection));

  const postMember = () => {
    hatena.postMember();
  };
  disposables.push(vscode.commands.registerCommand('extension.postMember', postMember));

  const putMember = () => {
    const converter = Converter.getInstance();
    const memberMap = converter.getMemberMap();
    
    if (memberMap !== null && memberMap !== undefined){
      // await hatena.putMember(memberMap.id as string);
    } else {
      vscode.window.showErrorMessage('Not exist Article Id.');
    }
  };
  disposables.push(vscode.commands.registerCommand('extension.putMember', putMember));
  context.subscriptions.concat(disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log("Extension deactivated.");
  const prefs = vscode.workspace.getConfiguration('UserPreferences');
  prefs.update("memberMap", null, vscode.ConfigurationTarget.Global);
}
