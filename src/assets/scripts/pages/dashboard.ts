import { spawn, ModuleThread } from "threads";

import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';
import { BalancesWorker } from "../workers/balances";
import { VotesWorker } from "../workers/votes";
import Utils from "../utils";

export default class PageDashboard {
  private daoGarden: DaoGarden;

  // workers
  private firstCall = true;
  private balancesWorker: ModuleThread<BalancesWorker>;
  private votesWorker: ModuleThread<VotesWorker>;

  constructor(daoGarden: DaoGarden) {
    this.daoGarden = daoGarden;
  }

  async open() {
    $('.page-dashboard').show();

    if(this.firstCall) {
      this.balancesWorker = await spawn<BalancesWorker>(new Worker('../workers/balances.ts'));
      this.votesWorker = await spawn<VotesWorker>(new Worker('../workers/votes.ts'));

      this.firstCall = false;
    }

    $('.link-home').addClass('active');
    this.syncPageState();
  }

  async close() {
    $('.link-home').removeClass('active');
    $('.page-dashboard').hide();
  }

  private async syncPageState() {
    const state = await this.daoGarden.getState();

    const {users, balance} = await this.balancesWorker.usersAndBalance(state.balances);
    const {vaultUsers, vaultBalance} = await this.balancesWorker.vaultUsersAndBalance(state.vault);

    $('.users').text(users.length).parents('.dimmer').removeClass('active');
    $('.users-vault').text(`${vaultUsers.length} `);

    const votes = await this.votesWorker.activeVotesByType(state.votes);
    const votesMint = votes.mint? votes.mint.length : 0;
    const votesVault = votes.mintLocked? votes.mintLocked.length : 0;
    const votesActive = votes.active? votes.active.length : 0;
    const votesAll = votes.all? votes.all.length : 0;

    
    $('.minted').text(Utils.formatMoney(balance + vaultBalance, 0));
    $('.mint-waiting').text(`${votesMint} `).parents('.dimmer').removeClass('active');
    $('.vault').text(Utils.formatMoney(vaultBalance, 0));
    $('.vault-waiting').text(`${votesVault} `).parents('.dimmer').removeClass('active');
    $('.ticker').text(` ${state.ticker} `);
    $('.votes').text(`${votesActive} `);
    $('.votes-completed').text(`${(votesAll - votesActive)} `).parents('.dimmer').removeClass('active');
  }
}