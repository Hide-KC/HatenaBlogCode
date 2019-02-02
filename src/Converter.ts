import * as vscode from 'vscode';
import * as fs from 'fs';

export default class Converter{
    private static instance: Converter;

    static getInstance() {
        if (!this.instance){
            this.instance = new Converter;
        }
        return this.instance;
    }

    createPostData(root: string, draft?: boolean) {
        const prefs = vscode.workspace.getConfiguration('UserPreferences');
        const id = prefs.get<string | undefined>('id');
        const content = fs.readFileSync(root + "\\content.md", {encoding: 'utf-8'});
        const _config = fs.readFileSync(root + "\\config.json", {encoding: 'utf-8'});
        const config = JSON.parse(_config);
        const useDraft = draft? 'yes' : 'no';

        const data =
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<entry xmlns="http://www.w3.org/2005/Atom" ' +
            'xmlns:app="http://www.w3.org/2007/app">' +
            `<title>${config.title}</title>` +
            `<author><name>${id}</name></author>` +
            `<content type="text/x-markdown">${content}</content>` +
            this.createCategoryTerms(config) +
            '<app:control>' +
            `<app:draft>${useDraft}</app:draft>` + 
            '</app:control>' +
            '</entry>';
        
        console.log(data);
        return data;
    }

    private createCategoryTerms(config: any) {
        const category = config.category;
        let terms: string = "";
        category.forEach((element: string) => {
            terms += (`<category term="${element}" />`);
        });

        return terms;
    }

    extendToVSCode() {

    }
}