import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';

export default class PageSettings {
  private daoGarden: DaoGarden;

  constructor(daoGarden: DaoGarden) {
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