import * as OAuth from 'oauth';
import * as vscode from 'vscode';
import Authorizer from './Authorizer';
import Converter from '../Converter';
import { isString } from 'util';
import Initialize from './Initialize';

export default class HatenaBlogUtil {
    private atomUri: string;
    private authorizer: Authorizer;
    private readonly contentType = "text/x-markdown";
    
    constructor() {
        const prefs = vscode.workspace.getConfiguration('UserPreferences');
        const id = prefs.get<string | undefined>('id');
        const domain = prefs.get<string | undefined>('domain');

        this.atomUri = `https://blog.hatena.ne.jp/${id}/${domain}/atom`;
        this.authorizer = Authorizer.getInstance();
    }

    /**
     * Get collection of Hatena blog.
     */
    getCollection() {
        if (!this.authorizer.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const collectionUri = this.atomUri + '/entry';
        this.oauthGET(collectionUri, (err, result, response) => {
            console.log(err);
            console.log(result);

            if (err !== null) {
                vscode.window.showErrorMessage("Get Collection Error: status " + err.statusCode);
            } else {
                vscode.window.showInformationMessage("Operation Succeed!");
            }
        });
    }

    /**
     * Get an article in Hatena blog.
     * @param entryId 
     */
    getMember(entryId: string) {
        if (!this.authorizer.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const memberUri = this.atomUri + `/entry/${entryId}`;
        this.oauthGET(memberUri, (err, result, response) => {
            if (err !== null){
                vscode.window.showErrorMessage("Get Article Error: status " + err.statusCode);
            } else if (isString(result)){
                vscode.window.showInformationMessage("Operation Succeed!");
                const memberMap = Converter.getInstance().getMemberMap(result);
                const initialize = new Initialize();
                initialize.createWorkingDirectory(memberMap);
            }
        });
    }

    /**
     * Get Hatena service xml.
     */
    getServiceXml() {
        if (!this.authorizer.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        this.oauthGET(this.atomUri, (err, result, response) => {
            console.log(err);
            console.log(result);

            if (err !== null) {
                vscode.window.showErrorMessage("Get Service Error: status " + err.statusCode);
            } else {
                vscode.window.showInformationMessage("Operation Succeed!");
            }
        });
    }

    /**
     * Get Hatena category.
     */
    getCategory() {
        if (!this.authorizer.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const categoryUri = this.atomUri + '/category';
        this.oauthGET(categoryUri, (err, result, response) => {
            console.log(err);
            console.log(result);

            if (err !== null) {
                vscode.window.showErrorMessage("Get Category Error: status " + err.statusCode);
                return;
            }
            
            vscode.window.showInformationMessage("Operation Succeed!");
            const regExp = new RegExp('category term=\".*\"', "g");
            const _categoryArray = (result as string).match(regExp);
            if (_categoryArray !== null) {
                _categoryArray.forEach((value, index, array) => {
                    const _category = value.match('category term=\"(.*)\"');
                    if (_category !== null){
                        console.log(_category[1]);
                    }
                });
            }
        });
    }

    postMember() {
        if (!this.authorizer.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const folders = vscode.workspace.workspaceFolders;
        if (folders !== undefined){
            //Macはfolders[0].uri.path
            const root = folders[0].uri.fsPath; 
            console.log(root);

            const converter = Converter.getInstance();
            this.oauthPOST(this.atomUri + "/entry", converter.createPostData(root), (err, result, responce) => {
                console.log(err);
                console.log(result);

                if (err !== null){
                    vscode.window.showErrorMessage("Post Article Error: status " + err.statusCode);
                } else if (isString(result)){
                    vscode.window.showInformationMessage("Operation Succeed!");
                    const memberMap = Converter.getInstance().getMemberMap(result);
                    const initialize = new Initialize();
                    initialize.mkConfig(root, memberMap);
                }
            });
        }
    }

    putMember(entryId: string) {
        if (!this.authorizer.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const folders = vscode.workspace.workspaceFolders;
        if (folders !== undefined){
            //Macはfolders[0].uri.path
            const root = folders[0].uri.fsPath; 
            console.log(root);

            const converter = Converter.getInstance();
            this.oauthPUT(this.atomUri + "/entry/" + entryId, converter.createPostData(root), (err, result, responce) => {
                console.log(err);
                console.log(result);

                if (err !== null) {
                    vscode.window.showErrorMessage("Update Article Error: status " + err.statusCode);
                } else {
                    vscode.window.showInformationMessage("Operation Succeed!");
                }
            });
        }
    }

    deleteMember(entryId: string) {
        if (!this.authorizer.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        this.oauthDELETE(this.atomUri + "/entry/" + entryId, (err, result, responce) => {
            console.log(err);
            console.log(result);

            if (err !== null) {
                vscode.window.showErrorMessage("Delete Article Error: status " + err.statusCode);
            } else {
                vscode.window.showInformationMessage("Operation Succeed!");
            }
        });
    }

    /**
     * Wrapper of oauth.get method.
     * @param uri 
     * @param callback 
     */
    private oauthGET(uri: string, callback: OAuth.dataCallback) {
        if (this.authorizer.existAccessToken()){
            const oauth = this.authorizer.getOAuth();
            oauth.get(
                uri,
                this.authorizer.getAccessToken().token as string,
                this.authorizer.getAccessToken().secret as string,
                callback
            );
        }
    }

    /**
     * Wrapper of oauth.post method.
     * @param uri 
     * @param content 
     * @param callback 
     */
    private oauthPOST(uri: string, content: any, callback: OAuth.dataCallback) {
        if (this.authorizer.existAccessToken()){
            const oauth = this.authorizer.getOAuth();
            oauth.post(
                uri,
                this.authorizer.getAccessToken().token as string,
                this.authorizer.getAccessToken().secret as string,
                content,
                this.contentType,
                callback
            );
        }
    }

    /**
     * Wrapper of oauth.put method.
     * @param uri 
     * @param content 
     * @param callback 
     */
    private oauthPUT(uri: string, content: any, callback: OAuth.dataCallback) {
        if (this.authorizer.existAccessToken()){
            const oauth = this.authorizer.getOAuth();
            oauth.put(
                uri,
                this.authorizer.getAccessToken().token as string,
                this.authorizer.getAccessToken().secret as string,
                content,
                this.contentType,
                callback
            );
        }
    }

    /**
     * Wrapper of oauth.delete method.
     * @param uri 
     * @param callback 
     */
    private oauthDELETE(uri: string, callback: OAuth.dataCallback) {
        if (this.authorizer.existAccessToken()){
            const oauth = this.authorizer.getOAuth();
            oauth.delete(
                uri,
                this.authorizer.getAccessToken().token as string,
                this.authorizer.getAccessToken().secret as string,
                callback
            );
        }
    }
}