import "../../styles/style.scss";

import "threads/register";
import $ from '../libs/jquery';
import "bootstrap/dist/js/bootstrap.bundle";

import '../global';
import PageJobs from "./jobs";
import PageJob from "./job";
import Account from "../models/account";
import Arweave from "arweave";
import Community from "community-js";
import PageCreateJob from "./create";
import Transaction from "arweave/node/lib/transaction";

class JobBoard {
  private hash: string;
  private hashes: string[];
  private arweave: Arweave;
  private community: Community;
  private account: Account;
  
  private firstCall = true;
  private fee = '';

  // Pages
  protected currentPage: PageJobs | PageJob | PageCreateJob; // Add all possible page objects here
  private pageJobs: PageJobs;
  private pageJob: PageJob;
  private pageCreateJob: PageCreateJob;

  getHashes(): string[] {
    return this.hashes;
  }
  getCurrentPage(): PageJob | PageJobs | PageCreateJob {
    return this.currentPage;
  }
  getArweave(): Arweave {
    return this.arweave;
  }
  getCommunity(): Community {
    return this.community;
  }
  getAccount(): Account {
    return this.account;
  }
  getFee(): String {
    return this.fee;
  }

  async getPageStr(): Promise<string> {
    return this.hashes[0] || 'home';
  }

  constructor() {
    if(window.location.host === 'community.xyz') {
      this.arweave = Arweave.init({
        host: 'arweave.net',
        protocol: 'https',
        port: 443
      });
    } else {
      this.arweave = Arweave.init({timeout: 100000});
    }
    
    this.community = new Community(this.arweave);
    this.account = new Account(this.arweave, this.community);

    this.pageJobs = new PageJobs();
    this.pageJob = new PageJob();
    this.pageCreateJob = new PageCreateJob();

    this.hashChanged(false);
  }

  async init() {
    if(!this.firstCall) {
      return;
    }
    this.firstCall = false;

    await this.updateFee();
    await this.account.init();
    $('body').fadeIn();
    
    await this.pageChanged();
    this.events();
  }

  async chargeFee(action: string): Promise<boolean> {
    await this.community.setCommunityTx(await this.community.getMainContractId());
    const target = await this.community.selectWeightedHolder();

    const tx: Transaction = await this.arweave.createTransaction({
      target,
      quantity: this.arweave.ar.arToWinston(this.fee)
    }, await this.account.getWallet());

    tx.addTag('App-Name', 'Community');
    tx.addTag('App-Version', '1.1.0');
    tx.addTag('Action', action);

    await this.arweave.transactions.sign(tx, await this.account.getWallet());
    const res = await this.arweave.transactions.post(tx);
    if (res.status !== 200 && res.status !== 202) {
      console.log(res);
      return false;
    }

    return true;
  }

  private async updateFee() {
    this.fee = await this.community.getActionCost(true, {formatted: true, decimals: 5, trim: true});
    $('.action-fee').text(this.fee);

    setTimeout(() => this.updateFee(), 60000);
  }

  private async hashChanged(updatePage = true) {
    this.hash = location.hash.substr(1);
    const hashes = this.hash.split('/');

    this.hashes = hashes;

    if(updatePage) {
      await this.pageChanged();
    }
  }

  private async pageChanged() {
    $('.dimmer').addClass('active');

    if(this.currentPage) {
      this.currentPage.close();
    }
    
    let page = await this.getPageStr();
    if(page === 'create' && !await this.account.isLoggedIn()) {
      window.location.hash = '';
    }

    if(page === 'home') {
      this.currentPage = this.pageJobs;
    } else if(page === 'create') {
      this.currentPage = this.pageCreateJob;
    } else {
      this.currentPage = this.pageJob;
    }

    // @ts-ignore
    window.currentPage = this.currentPage;

    await this.updateTxFee();
    await this.currentPage.open();
  }

  private async updateTxFee() {
    const fee = await this.community.getActionCost(true, {formatted: true, decimals: 5, trim: true});
    $('.tx-fee').text(fee);

    setTimeout(() => this.updateTxFee(), 60000);
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
const jobboard = new JobBoard();
export default jobboard;

$(document).ready(() => {
  jobboard.init();
});