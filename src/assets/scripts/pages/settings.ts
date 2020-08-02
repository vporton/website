import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';

export default class PageSettings {
  private arweave: Arweave;
  private daoGarden: DaoGarden;

  constructor(arweave: Arweave, daoGarden: DaoGarden) {
    this.arweave = arweave;
    this.daoGarden = daoGarden;
  }

  async open() {
    $('.link-settings').addClass('active');
    $('.page-settings').show();
    this.syncPageState();
  }

  async close() {
    $('.link-settings').removeClass('active');
    $('.page-settings').hide();
  }

  private async syncPageState() {
    const state = await this.daoGarden.getState();
    
    // TODO: Update the page with state here

    $('.dimmer').removeClass('active');
  }
}