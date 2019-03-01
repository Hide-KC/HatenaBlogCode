import * as api from './APIValues';
import * as OAuth from 'oauth';
import * as vscode from 'vscode';
import * as rp from 'request-promise';
import { isString } from 'util';

export default class Authorizer{
  private static instance: Authorizer;
  private user: {[s: string]: string | undefined};
  private accessToken: {[s: string]: string | undefined} = {'token': undefined, 'secret': undefined};
  private oauth = new OAuth.OAuth(
    api.TMP_CREDENTIAL_REQUEST_URL,
    api.USER_TOKEN_URL,
    api.COMSUMER_KEY,
    api.COMSUMER_SECRET,
    '1.0',
    'oob',
    'HMAC-SHA1'
  );

  private constructor() {
    const prefs = vscode.workspace.getConfiguration('UserPreferences');
    const id = prefs.get<string | undefined>('id');
    const password = prefs.get<string | undefined>('password');
    this.user = {"name": id, 'password': password};

    const token = prefs.get<string>('token');
    const secret = prefs.get<string>('secret');
    this.accessToken.token = token;
    this.accessToken.secret = secret;
    console.log(this.accessToken);
  }

  static getInstance() {
    if (!this.instance){
      this.instance = new Authorizer();
    }
    return this.instance;
  }

  getOAuth() {
    return this.oauth;
  }

  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Start OAuth v1.0
   */
  async startOAuth() {
    if (this.existAccessToken()) {
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

  /**
   * Get RK (need for login).
   */
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

  /**
   * Get RKM (need for parmission). 
   * @param requestToken 
   * @param rk 
   */
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

  /**
   * Get oauth verifier.
   * @param requestToken
   * @param rk
   * @param rkm
   */
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

  /**
   * If UserPreferences has AccessToken & AccessTokenSecret, return true.
   */
  existAccessToken() {
    //undefined または 空文字の場合 false
    const prefs = vscode.workspace.getConfiguration('UserPreferences');
    const token = prefs.get<string>('token');
    const secret = prefs.get<string>('secret');

    return !(
      token === undefined ||
      token === "" ||
      secret === undefined ||
      secret === ""
      );
  }
}