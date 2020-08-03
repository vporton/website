import Arweave from "arweave/web";
import { JWKInterface } from "arweave/web/lib/wallet";
import { get, getIdenticon } from 'arweave-id';

import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';

export default class Account {
  private arweave: Arweave;
  private daoGarden: DaoGarden;

  private wallet: JWKInterface;
  private username: string = '';
  private avatar: string = '';
  private address: string = '';
  private balance: number = 0;

  constructor(arweave: Arweave, daoGarden: DaoGarden) {
    this.arweave = arweave;
    this.daoGarden = daoGarden;
  }

  async init() {
    if(window.sessionStorage.getItem('sesswall')) {
      await this.loadWallet(JSON.parse(atob(window.sessionStorage.getItem('sesswall'))));
    }

    this.events();
  }

  async getArweaveId(address: string = this.address) {
    return get(address, this.arweave);
  }

  private async loadWallet(wallet: JWKInterface) {
    this.wallet = wallet;

    this.address = await this.arweave.wallets.jwkToAddress(this.wallet);
    this.balance = +this.arweave.ar.winstonToAr((await this.arweave.wallets.getBalance(this.address)), { formatted: true, decimals: 5, trim: true });

    const acc = await get(this.address, this.arweave);
    this.username = acc.name;
    this.avatar = acc.avatarDataUri || getIdenticon(this.address);

    $('.user-name').text(this.username);
    $('.user-avatar').css('background-image', `url(${this.avatar})`);

    // Complete login
    $('.form-file-button').html('Browse');
    if(this.address.length && this.balance >= 0) {
      $('#login-modal').modal('hide');
      $('.loggedin').show();
      $('.loggedout').hide();
    }
  }

  private login(e: any) {
    if(e.target && e.target.files) {
      $('.form-file-text').text($(e.target).val().replace(/C:\\fakepath\\/i, ''));
      $('.form-file-button').html('<div class="spinner-border spinner-border-sm" role="status"></div>');

      const fileReader = new FileReader();
      fileReader.onload = async (ev: any) => {
        await this.loadWallet(JSON.parse(ev.target.result));
        
        if(this.address.length && this.balance >= 0) {
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
  }
}