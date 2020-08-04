import "../styles/board.scss";

import "threads/register";
import Arweave from 'arweave/web';
import DaoGarden from './daogarden-js/daogarden';
import $ from './libs/jquery';
import "bootstrap/dist/js/bootstrap.bundle";

import './global';
import PageDashboard from "./pages/dashboard";
import PageTokens from "./pages/tokens";
import PageVotes from "./pages/votes";
import PageVault from "./pages/vault";
import PageSettings from "./pages/settings";
import Account from "./models/account";

class App {
  private hash: string;
  private hashes: string[];
  private arweave: Arweave;
  private daoGarden: DaoGarden;
  private account: Account;
  
  // Pages
  private currentPage: PageDashboard | PageTokens | PageVotes | PageVault | PageSettings; // Add all possible page objects here
  private pageDashboard: PageDashboard;
  private pageTokens: PageTokens;
  private pageVotes: PageVotes;
  private pageVault: PageVault;
  private pageSettings: PageSettings;
  

  constructor() {
    this.arweave = Arweave.init({});
    this.daoGarden = new DaoGarden(this.arweave);
    this.account = new Account(this.arweave, this.daoGarden);

    this.pageDashboard = new PageDashboard(this.daoGarden);
    this.pageTokens = new PageTokens(this.daoGarden, this.account, this.arweave);
    this.pageVotes = new PageVotes(this.daoGarden, this.account);
    this.pageVault = new PageVault(this.daoGarden, this.account, this.arweave);
    this.pageSettings = new PageSettings(this.daoGarden);

    this.hashChanged(false);
  }

  async init() {
    await this.account.init();
    $('body').show();

    await this.updateLinks();
    await this.daoGarden.setDAOTx(this.hashes[0]);
    await this.pageChanged();

    this.events();
  }

  public getCurrentPage() {
    return this.currentPage;
  }

  private async getPageStr(): Promise<string> {
    return this.hashes[1] || 'home';
  }

  private async updateLinks() {
    $('a').each((i: number, e: Element) => {
      const link = $(e).attr('href').split('#');
      if(link.length > 1 && link[1] !== '!' && !link[1].startsWith(this.hashes[0])) {
        $(e).attr('href', `#${this.hashes[0]}${link[1]}`);
      }
    });
  }

  private async hashChanged(updatePage = true) {
    this.hash = location.hash.substr(1);
    this.hashes = this.hash.split('/');
    
    // To be able to access the dashboard, you need to send a DAO txId.
    if(!this.hashes.length || !(/^[a-z0-9-_]{43}$/i.test(this.hashes[0]))) {
      window.location.href = './create.html';
    }

    if(updatePage) {
      await this.pageChanged();
    }
  }

  private async pageChanged() {
    $('.dimmer').addClass('active');

    if(this.currentPage) {
      this.currentPage.close();
    }

    const page = await this.getPageStr();
    if(page === 'home') {
      this.currentPage = this.pageDashboard;
    } else if(page === 'tokens') {
      this.currentPage = this.pageTokens;
    } else if(page === 'votes') {
      this.currentPage = this.pageVotes;
    } else if(page === 'vault') {
      this.currentPage = this.pageVault;
    } else if(page === 'settings') {
      this.currentPage = this.pageSettings;
    }

    await this.updateTxFee();
    await this.currentPage.open();
    $('.page-header').find('.page-title').text((await this.daoGarden.getState()).name);
  }

  private async updateTxFee() {
    const fee = await this.daoGarden.getActionCost(true, {formatted: true, decimals: 5, trim: true});
    $('.tx-fee').text(fee);

    setTimeout(() => this.updateTxFee(), 10000);
  }

  private async events() {
    $(window).on('hashchange', () => {
      this.hashChanged();
    });

    $(document).on('input', '.input-number', (e: any) => {
      const $target = $(e.target);
      const newVal = +$target.val().toString().replace(/[^0-9]/g, '');
      $target.val(newVal);
  
      if($target.hasClass('percent') && newVal > 99) {
        $target.val(99);
      }
    });
  }
}

const app = new App();
export default app;

$(document).ready(() => {
  app.init();
});