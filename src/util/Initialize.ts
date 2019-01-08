import * as fs from "fs";
import * as vscode from 'vscode';

export class Initialize {
    private initContent = 
        '# 見出し\n' +
        'このファイルに、はてな Markdown で記述します。'
    ;

    createDirectory = () => {
        const user = vscode.workspace.getConfiguration('UserPreferences');
		console.log(user.get('id'));
		console.log(user.get('password'));
		
		const folderOptions: vscode.OpenDialogOptions = {
			canSelectMany: false,
			canSelectFiles: false,
			canSelectFolders: true,
			openLabel: 'Select',
			filters: {
			   'All files': ['*']
		   }
		};
		
		vscode.window.showOpenDialog(folderOptions).then(folderUri => {
			if (folderUri) {
				const root = folderUri[0].fsPath + '\\HatenaBlogCode';
                console.log('Selected directory: ' + root);

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

                        this.mkContent(root + '\\content.md', this.initContent);

                        this.mkConfig(root + '\\config.json', {
                            'title': 'Article Title',
                            'categories': ["hoge", "bar"]
                        });
                    }
                });
		   }
	   });
    }

    mkContent = (path: string, data: any) => {
        fs.writeFile(path, data, (err) => {
            if (err !== null){
                console.log(err);
                throw err;
            }
        });
    }

    mkConfig = (path: string, data: any) => {
        const json = JSON.stringify(data);
        fs.writeFile(path, json, (err) => {
            if (err !== null){
                console.log(err);
                throw err;
            }
        });
    }
}