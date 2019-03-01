import * as fs from "fs";
import * as vscode from 'vscode';

export default class Initialize {
  private initContent = 
    '# 見出し\n' +
    'このファイルに、はてな Markdown で本文を記述します。'
  ;

  //日付のシリアライズに注意 2013-09-02T11:28:23+09:00
  //https://qiita.com/think49/items/b314eb874a66e9fe9e19
  private initConfig: {[key: string]: string | string[]} = {
    id: "",
    title: 'Article Title',
    category: ['hoge', 'bar'],
    updated: ""
  };

  createWorkingDirectory(memberMap?: {[key: string]: string | string[]}) {
    const folderOptions: vscode.OpenDialogOptions = {
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: 'Select',
      filters: {
         'All files': ['*']
       }
    };
    
    const inputBoxOptions: vscode.InputBoxOptions = {
      prompt: "Input working directory name.",
      placeHolder: "Article title etc..."
    };
    
    vscode.window.showOpenDialog(folderOptions).then(folderUri => {
      if (folderUri) {
        vscode.window.showInputBox(inputBoxOptions).then(directoryName => {
          if (directoryName !== undefined){
            const root = folderUri[0].fsPath + `\\${directoryName}`;
            fs.mkdir(root, (err) => {
              if (err !== null){
                console.log(err);
                throw err;
              } else {
                fs.mkdir(root + '\\images', err => {
                  if (err !== null){
                    console.log(err);
                    throw err;
                  }
                });
    
                const prefs = vscode.workspace.getConfiguration('UserPreferences');
                if (memberMap !== undefined){
                  this.mkContent(root, memberMap.content);
                  this.mkConfig(root, {
                    id: memberMap.id,
                    title: memberMap.title,
                    category: memberMap.category,
                    updated: memberMap.updated
                  });
                  prefs.update("memberMap", memberMap, vscode.ConfigurationTarget.Global);
                } else {
                  this.mkContent(root, this.initContent);
                  this.mkConfig(root, this.initConfig);
                  //Preferenceはundifined代入不可っぽい（nullになる）
                  prefs.update("memberMap", null, vscode.ConfigurationTarget.Global);
                }
              }
            });
            return root;
          }
        }, err => {
          console.log(err);
        }).then(root => {
          if (root !== undefined){
            console.log('Working directory: ' + root);
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(root), false);
          }
        }, err => {
          console.log(err);
        });
      }
    });
  }

  /**
   * Create content.md file.
   * @param path 
   * @param data 
   */
  private mkContent(path: string, data: any) {
    fs.writeFile(path + '\\content.md', data, err => {
      if (err !== null){
        console.log(err);
        throw err;
      }
    });
  }

  /**
   * Create config.json file.
   * @param path 
   * @param memberMap 
   */
  mkConfig(path: string, memberMap: {[key: string]: string | string[]}) {
    const data ={
      id: memberMap.id,
      title: memberMap.title,
      category: memberMap.category,
      updated: memberMap.updated
    };
    
    const json = JSON.stringify(data, null, '    ');
    fs.writeFile(path + '\\config.json', json, err => {
      if (err !== null){
        console.log(err);
        throw err;
      }
    });
  }
}