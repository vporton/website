import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';
import Account from '../modals/account';

export default class PageVault {
  private daoGarden: DaoGarden;
  private account: Account;

  constructor(daoGarden: DaoGarden, account: Account) {
    this.daoGarden = daoGarden;
    this.account = account;
  }

  async open() {
    $('.link-vault').addClass('active');
    $('.page-vault').show();
    this.syncPageState();
  }

  async close() {
    $('.link-vault').removeClass('active');
    $('.page-vault').hide();
  }

  public async syncPageState() {
    const state = await this.daoGarden.getState();
    
    // TODO: Update the page with state here

    $('.dimmer').removeClass('active');
  }
}