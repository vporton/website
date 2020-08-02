import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';

export default class PageTokens {
  private arweave: Arweave;
  private daoGarden: DaoGarden;

  constructor(arweave: Arweave, daoGarden: DaoGarden) {
    this.arweave = arweave;
    this.daoGarden = daoGarden;
  }

  async open() {
    $('.link-tokens').addClass('active');
    $('.page-tokens').show();
    this.syncPageState();
  }

  async close() {
    $('.link-tokens').removeClass('active');
    $('.page-tokens').hide();
  }

  private async syncPageState() {
    const state = await this.daoGarden.getState();
    
    // TODO: Update the page with state here

    $('.dimmer').removeClass('active');
  }
}