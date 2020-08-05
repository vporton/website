import Arweave from 'arweave/web';
import Community from '../community-js/community';
import $ from '../libs/jquery';
import app from '../app';

export default class PageSettings {
  constructor() {}

  async open() {
    $('.link-settings').addClass('active');
    $('.page-settings').show();
    this.syncPageState();
  }

  async close() {
    $('.link-settings').removeClass('active');
    $('.page-settings').hide();
  }

  public async syncPageState() {
    const state = await app.getCommunity().getState();
    
    // TODO: Update the page with state here

    $('.dimmer').removeClass('active');
  }
}