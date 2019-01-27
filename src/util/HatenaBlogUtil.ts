import * as api from './APIValues';
import * as OAuth from 'oauth';
import * as vscode from 'vscode';
import * as rp from 'request-promise';
import { isString } from 'util';
import * as xmlJS from 'xml-js';

export class HatenaBlogUtil {
    private user: {[s: string]: string | undefined};
    public accessToken: {[s: string]: string | undefined} = {'token': undefined, 'secret': undefined};
    private oauth = new OAuth.OAuth(
        api.TMP_CREDENTIAL_REQUEST_URL,
        api.USER_TOKEN_URL,
        api.COMSUMER_KEY,
        api.COMSUMER_SECRET,
        '1.0',
        'oob',
        'HMAC-SHA1'
    );

    private atomUri: string;
    
    constructor() {
        const prefs = vscode.workspace.getConfiguration('UserPreferences');
        const id = prefs.get<string | undefined>('id');
        const password = prefs.get<string | undefined>('password');
        this.user = {"name": id, 'password': password};

        const domain = prefs.get<string | undefined>('domain');
        this.atomUri = `https://blog.hatena.ne.jp/${id}/${domain}/atom`;

        const token = prefs.get<string>('token');
        const secret = prefs.get<string>('secret');
        this.accessToken.token = token;
        this.accessToken.secret = secret;
        console.log(this.accessToken);
    }

    async startOAuth() {
        const prefs = vscode.workspace.getConfiguration('UserPreferences');
        const token = prefs.get<string>('token');
        const secret = prefs.get<string>('secret');
        if ((token !== "" && secret !== "") && (token !== undefined && secret !== undefined)) {
            this.accessToken.token = token;
            this.accessToken.secret = secret;
            console.log(this.accessToken);
            return;
        } else if (this.user.name === undefined || this.user.password === undefined) {
            throw new Error('Please confirm UserPreferences.');
        }

        this.oauth.getOAuthRequestToken({
            'scope': 'read_public,write_public,read_private,write_private'
        }, async (err, request_token, request_token_secret, results) => {
            if (err !== null){
                console.log(err);
            } else {
                console.log('redirectUrl: ' + api.RES_OWNER_AUTH_URL + '?oauth_token=' + request_token);

                this.getRK()
                .then((rk) => {
                    return this.getRKM(request_token, rk as string);
                })
                .then((arr) => {
                    if (arr === null) {throw new Error();}
                    return this.getVerifier(request_token, arr.rk, arr.rkm);
                })
                .then((verifier) => {
                    if (!isString(verifier)) {throw new Error();}
                    this.oauth.getOAuthAccessToken(request_token, request_token_secret, verifier, (err, accessToken, accessTokenSecret, parsedQueryString) => {
                        if (err !== null){
                            console.log(err);
                        } else {
                            console.log(">>>Congraturations!!<<<");
                            console.log('AccessToken: ' + accessToken);
                            console.log('AccessTokenSecret: ' + accessTokenSecret);
                            this.accessToken.token = accessToken;
                            this.accessToken.secret = accessTokenSecret;

                            const prefs = vscode.workspace.getConfiguration('UserPreferences');
                            prefs.update('token', accessToken, vscode.ConfigurationTarget.Global);
                            prefs.update('secret', accessTokenSecret, vscode.ConfigurationTarget.Global);
                        }
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
            }
        });
    }

    private async getRK() {
        //ヘッダーを定義
        const headers = {'Content-Type':'application/json'};

        //オプションを定義
        const loginOptions = {
            url: api.LOGIN_URL,
            method: 'POST',
            headers: headers,
            json: true,
            form: this.user,
            resolveWithFullResponse: true
        };

        return await rp(loginOptions)
        .then((response) => {
            const cookie = response.headers['set-cookie'];
            if (cookie !== undefined){
                const _rk = (cookie as string[])[5].match("(rk=.*); domain");
                if (_rk !== null){
                    const rk = _rk[1];
                    console.log('rk: ' + rk);
                    return rk;
                }
            } else {
                return null;
            }
        });
    }

    private async getRKM(requestToken: string, rk: string) {
        const reqTokenOptions = {
            url: api.RES_OWNER_AUTH_URL,
            qs: { oauth_token: requestToken },
            method: 'GET',
            headers: { cookie: rk }
        };

        return await rp(reqTokenOptions)
        .then((response) => {
            const _rkm = response.match("name=\"rkm\" value=\"(.*)\"");
            if (_rkm !== null){
                const rkm = _rkm[1];
                console.log('rkm: ' + rkm);
                return {'rk': rk, 'rkm': rkm as string};
            } else {
                return null;
            }
        });
    }

    private async getVerifier(requestToken: string, rk: string, rkm: string) {
        const verifierOptions = {
            url: api.RES_OWNER_AUTH_URL,
            qs: { oauth_token: requestToken, rkm: rkm },
            method: 'POST',
            headers: { cookie: rk }
        };

        return await rp(verifierOptions)
        .then((response) => {
            const _verifier = response.match("<div class=verifier><pre>(.*)</pre></div>");
            if (_verifier !== null){
                const verifier = _verifier[1];
                console.log('verifier: ' + verifier);
                return verifier as string;
            } else {
                return null;
            }
        });
    }

    getCollection() {
        if (!this.existAccessToken) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const collectionUri = this.atomUri + '/entry';
        this.oauthGET(collectionUri, (err, result, response) => {
            console.log(err);
            console.log(result);
        });
    }

    getMember(entryId: string) {
        if (!this.existAccessToken) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const memberUri = this.atomUri + `/entry/$${entryId}`;
        this.oauthGET(memberUri, (err, result, response) => {
            console.log(err);
            console.log(result);
        });
    }

    getServiceXml() {
        if (!this.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        this.oauthGET(this.atomUri, (err, result, response) => {
            console.log(err);
            console.log(result);
        });
    }

    getCategories() {
        if (!this.existAccessToken()) {
            vscode.window.showErrorMessage("Not stored AccessToken!");
            return;
        }

        const categoriesUri = this.atomUri + '/category';
        this.oauthGET(categoriesUri, (err, result, response) => {
            console.log(err);
            console.log(result);
        });
    }

    existAccessToken() {
        //undefined または 空文字の場合 false
        return ((this.accessToken.token !== undefined && this.accessToken.secret !== undefined) || (this.accessToken.token !== "" && this.accessToken.secret !== ""));
    }

    private oauthGET(uri: string, callback: OAuth.dataCallback) {
        this.oauth.get(uri, this.accessToken.token as string, this.accessToken.secret as string, callback);
    }
}