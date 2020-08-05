import Arweave from "arweave/web";
import { JWKInterface } from "arweave/web/lib/wallet";
import { get, getIdenticon } from 'arweave-id';

import Community from '../community-js/community';
import $ from '../libs/jquery';
import app from "../app";
import Toast from "../utils/toast";

export default class Account {
  private loggedIn: boolean = false;
  private wallet: JWKInterface;
  private username: string = '';
  private avatar: string = '';
  private address: string = '';
  private arBalance: number = -1;
  private balance: number = -1;
  private unlockedBalance: number = -1;
  private vaultBalance: number = -1;

  constructor() {}

  async init() {
    if(window.sessionStorage.getItem('sesswall')) {
      await this.loadWallet(JSON.parse(atob(window.sessionStorage.getItem('sesswall'))));
    }

    this.events();
  }

  async getArweaveId(address: string = this.address) {
    return get(address, app.getArweave());
  }

  async isLoggedIn(): Promise<boolean> {
    return this.loggedIn;
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  async getArBalance(cached = true): Promise<number> {
    this.arBalance = +app.getArweave().ar.winstonToAr((await app.getArweave().wallets.getBalance(this.address)), { formatted: true, decimals: 5, trim: true });
    return this.arBalance;
  }

  async showLoginError() {
    const toast = new Toast();
    toast.show('Login first', 'Before being able to do this action you need to login.', 'login', 10000);
  }

  // Setters
  private async loadWallet(wallet: JWKInterface) {
    this.wallet = wallet;

    this.address = await app.getCommunity().setWallet(wallet);
    this.arBalance = +app.getArweave().ar.winstonToAr((await app.getArweave().wallets.getBalance(this.address)), { formatted: true, decimals: 5, trim: true });

    const acc = await get(this.address, app.getArweave());
    this.username = acc.name;
    this.avatar = acc.avatarDataUri || getIdenticon(this.address);

    $('.user-name').text(this.username);
    $('.user-avatar').css('background-image', `url(${this.avatar})`);

    // Complete login
    $('.form-file-button').removeClass('btn-loading disabled');
    if(this.address.length && this.arBalance >= 0) {
      this.loggedIn = true;
      $('#login-modal').modal('hide');
      $('.loggedin').show();
      $('.loggedout').hide();
    }
  }

  private login(e: any) {
    if(e.target && e.target.files) {
      $('.form-file-text').text($(e.target).val().replace(/C:\\fakepath\\/i, ''));
      $('.form-file-button').addClass('btn-loading disabled');

      const fileReader = new FileReader();
      fileReader.onload = async (ev: any) => {
        await this.loadWallet(JSON.parse(ev.target.result));
        app.getCurrentPage().syncPageState();
        
        if(this.address.length && this.arBalance >= 0) {
          window.sessionStorage.setItem('sesswall', btoa(ev.target.result));
        }
      };
      fileReader.readAsText(e.target.files[0]);
    }
  }

  private events() {
    $('.file-upload-default').on('change', (e: any) => {
      this.login(e);
    });

    $('.logout').on('click', async (e: any) => {
      e.preventDefault();

      $('.loggedin').hide();
      $('.loggedout').show();

      this.loggedIn = false;
      this.wallet = null;
      this.username = '';
      this.avatar = '';
      this.address = '';
      this.arBalance = 0;

      app.getCurrentPage().syncPageState();
      window.sessionStorage.removeItem('sesswall');

      await app.getCommunity().setWallet(null);
    });
  }
}