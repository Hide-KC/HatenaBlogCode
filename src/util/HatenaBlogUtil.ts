import * as api from './APIValues';
import * as OAuth from 'oauth';
import * as vscode from 'vscode';
import * as rp from 'request-promise';
import { isString } from 'util';
import * as xmlJS from 'xml-js';

// const account = {'name': 'kcpoipoi', 'password': 'finl21347'};

export class HatenaBlogUtil {
    private user: {[s: string]: string | undefined};
    private accessToken: string | null = null;
    private accessTokenSecret: string | null = null;

    constructor() {
        const prefs = vscode.workspace.getConfiguration('UserPreferences');
        const id = prefs.get<string | undefined>('id');
        const password = prefs.get<string | undefined>('password');
        this.user = {"name": id, 'password': password};
    }

    startOAuth = async () => {
        if (this.user.name === undefined || this.user.password === undefined) {throw new Error('Please confirm UserPreferences');}

        const oauth = new OAuth.OAuth(
            api.TMP_CREDENTIAL_REQUEST_URL,
            api.USER_TOKEN_URL,
            api.COMSUMER_KEY,
            api.COMSUMER_SECRET,
            '1.0',
            'oob',
            'HMAC-SHA1'
        );

        oauth.getOAuthRequestToken({
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
                    oauth.getOAuthAccessToken(request_token, request_token_secret, verifier, (err, accessToken, accessTokenSecret, parsedQueryString) => {
                        if (err !== null){
                            console.log(err);
                        } else {
                            console.log(">>>Congraturations!!<<<");
                            console.log('AccessToken: ' + accessToken);
                            console.log('AccessTokenSecret: ' + accessTokenSecret);
                            console.log('ParsedQueryString: ' + parsedQueryString);
                        }
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
            }
        });
    }

    private getRK = async () => {
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

    private getRKM = async (requestToken: string, rk: string) => {
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

    private getVerifier = async (requestToken: string, rk: string, rkm: string) => {
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

    postBlog = () => {

    }

    getBlog = (blogId: any) => {

    }
}