import * as fs from "fs";
import * as vscode from 'vscode';

export class Initialize {
    private initContent = 
        '# 見出し\n' +
        'このファイルに、はてな Markdown で本文を記述します。'
    ;

    createWorkingDirectory() {
        // const user = vscode.workspace.getConfiguration('UserPreferences');
		// console.log(user.get('id'));
		// console.log(user.get('password'));
		
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
			placeHolder: "eg. Article title"
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
                                fs.mkdir(root + '\\images', (err) => {
                                    if (err !== null){
                                        console.log(err);
                                        throw err;
                                    }
                                });
        
                                this.mkContent(root, this.initContent);
        
                                this.mkConfig(root, {
                                    'title': 'Article Title',
                                    'categories': ['hoge', 'bar']
                                });
                            }
                        });

                        return root;
                    }
                }, err => {
                    console.log(err);
                }).then(root => {
                    if (root !== undefined){
                        console.log('Working directory: ' + root);
                        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(root));
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
        fs.writeFile(path + '\\content.md', data, (err) => {
            if (err !== null){
                console.log(err);
                throw err;
            }
        });
    }

    /**
     * Create config.json file.
     * @param path 
     * @param data 
     */
    private mkConfig(path: string, data: any) {
        const json = JSON.stringify(data, null, '    ');
        fs.writeFile(path + '\\config.json', json, (err) => {
            if (err !== null){
                console.log(err);
                throw err;
            }
        });
    }
}