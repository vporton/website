import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';

export default class PageVotes {
  private arweave: Arweave;
  private daoGarden: DaoGarden;

  constructor(arweave: Arweave, daoGarden: DaoGarden) {
    this.arweave = arweave;
    this.daoGarden = daoGarden;
  }

  async open() {
    $('.link-votes').addClass('active');
    $('.page-votes').show();
    setTimeout(() => this.syncPageState(), 1000);
  }

  async close() {
    $('.link-votes').removeClass('active');
    $('.page-votes').hide();
  }

  private async syncPageState() {
    const state = await this.daoGarden.getState();
    
    // TODO: Update the page with state here

    $('.dimmer').removeClass('active');
  }
}