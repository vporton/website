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

  init() {

    this.events();
  }

  private login(e: any) {
    if(e.target && e.target.files) {
      $('.form-file-text').text($(e.target).val().replace(/C:\\fakepath\\/i, ''));
      $('.form-file-button').html('<div class="spinner-border spinner-border-sm" role="status"></div>');

      const fileReader = new FileReader();
      fileReader.onload = async (ev: any) => {
        this.wallet = JSON.parse(ev.target.result);
        this.address = await this.arweave.wallets.jwkToAddress(this.wallet);
        this.balance = +this.arweave.ar.winstonToAr((await this.arweave.wallets.getBalance(this.address)), { formatted: true, decimals: 5, trim: true });

        const acc = await get(this.address, this.arweave);
        this.username = acc.name;
        this.avatar = acc.avatarDataUri || getIdenticon(this.address);

        $('.user-name').text(this.username);
        $('.user-avatar').css('background-image', this.avatar);

        // Complete login
        $('.form-file-button').html('Browse');
        if(this.address.length && this.balance >= 0) {
          $('#login-modal').modal('hide');
          $('.loggedin').show();
          $('.loggedout').hide();
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