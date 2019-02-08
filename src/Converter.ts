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
        const _content = fs.readFileSync(root + "\\content.md", {encoding: 'utf-8'});
        const content = this.escapeHtml(_content);
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
            `<updated>${config.updated}</updated>` +
            this.createCategoryTerms(config) +
            '<app:control>' +
            `<app:draft>${useDraft}</app:draft>` + 
            '</app:control>' +
            '</entry>';
        
        return data;
    }

    getMemberMap(memberXml: string): {[key: string]: string | string[]} {
        const id = () => {
            const _id = memberXml.match('<link rel=\"edit\" href=\".*/entry/(.*)\"/>');
            return _id? _id[1] : "";
        };
        
        const title = () => {
            const _title = memberXml.match('<title>(.*)</title>');
            return _title? this.decodeHtml(_title[1]) : "";
        };
        
        const content = () => {
            const regExp = new RegExp('<content type="text/x-markdown">([\\s\\S]*?)</content>', "m");
            const _content = memberXml.match(regExp);
            return _content? this.decodeHtml(_content[1]) : "";
        };

        const category = () => {
            const regExp = new RegExp('category term=\".*\"', "g");
            const _memberMap = memberXml.match(regExp);
            const memberMap: string[] = [];
            
            if (_memberMap !== null) {
                _memberMap.forEach((value, index, array) => {
                    const _category = value.match('category term=\"(.*)\"');
                    if (_category !== null){
                        memberMap.push(_category[1]);
                    }
                });
            }

            return memberMap;
        };

        const updated = (): string => {
            const _updated = memberXml.match('<updated>(.*)</updated>');
            return _updated? _updated[1] : "";
        };

        const memberMap: {[key:string]: string | string[]} = {
            id: id(),
            title: title(),
            content: content(),
            updated: updated(),
            category: category()
        };

        console.log(memberMap);

        return memberMap;
    }

    private createCategoryTerms(config: any) {
        const category = config.category;
        let terms: string = "";
        category.forEach((element: string) => {
            terms += (`<category term="${element}" />`);
        });

        return terms;
    }

    private escapeHtml (content: string) {
        const replaceMap: {[key: string]: string} = {
            "&": '&amp;',
            "'": '&#x27;',
            '`': '&#x60;',
            '"': '&quot;',
            '<': '&lt;',
            '>': '&gt;'
        };
        
        return content.replace(/[&'`"<>]/g, (match) => {
          return replaceMap[match];
        });
    }

    private decodeHtml (content: string) {
        const replaceMap: {[key: string]: string} = {
            '&amp;': "&",
            '&#x27;': "'",
            '&#39;': "'",
            '&#x60;': '`',
            '&quot;': '"',
            '&lt;': '<',
            '&gt;': '>'
        };
        
        return content.replace(/(&amp;|&#x27;|&#39;|&#x60;|&quot;|&lt;|&gt;)/g, (match) => {
          return replaceMap[match];
        });
    }
}