import "../styles/board.scss";

import Arweave from 'arweave/web';
import DaoGarden from './daogarden-js/daogarden';
import $ from './libs/jquery';
import "bootstrap/dist/js/bootstrap.bundle";

import './global';
import Dashboard from "./dashboard";

class App {
  private hash: string;
  private hashes: string[];
  private arweave: Arweave;
  private daoGarden: DaoGarden;
  
  // Pages
  private currentPage: Dashboard; // Add all possible page objects here
  private dashboard: Dashboard;
  

  constructor() {
    this.hashChanged();
    
    this.arweave = Arweave.init({});
    this.daoGarden = new DaoGarden(this.arweave);
    this.dashboard = new Dashboard(this.arweave, this.daoGarden);
  }

  async init() {
    await this.daoGarden.setDAOTx(this.hashes[0]);

    this.pageChanged();
    this.events();
  }

  private async getCurrentPage(): Promise<string> {
    return this.hashes[1] || 'home';
  }

  private async updateLinks() {
    $('a').each((i: number, e: Element) => {
      const link = $(e).attr('href').split('#');
      if(link.length > 1) {
        $(e).attr('href', `#${this.hashes[0]}${link[1]}`);
      }
    });
  }

  private async hashChanged() {
    this.hash = location.hash.substr(1);
    this.hashes = this.hash.split('/');
    
    // To be able to access the dashboard, you need to send a DAO txId.
    if(!this.hashes.length || !(/^[a-z0-9-_]{43}$/i.test(this.hashes[0]))) {
      window.location.href = './create.html';
    }

    this.pageChanged();
  }

  private async pageChanged() {
    if(this.currentPage) {
      this.currentPage.close();
    }

    const page = await this.getCurrentPage();
    if(page === 'home') {
      $('.link-home').addClass('active');
      this.currentPage = this.dashboard;
    } else if(page === 'tokens') {
      $('.link-tokens').addClass('active');
    } else if(page === 'votes') {
      $('.link-votes').addClass('active');
    } else if(page === 'vault') {
      $('.link-vault').addClass('active');
    }

    await this.currentPage.open();
    await this.updateLinks();
  }

  private async events() {
    $(window).on('hashchange', () => {
      this.hashChanged();
    });
  }
}

const app = new App();
$(document).ready(() => {
  app.init();
});