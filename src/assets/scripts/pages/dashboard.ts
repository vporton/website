import { spawn, ModuleThread } from "threads";

import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';
import { BalancesWorker } from "../workers/balances";
import { VotesWorker } from "../workers/votes";

export default class PageDashboard {
  private arweave: Arweave;
  private daoGarden: DaoGarden;

  // workers
  private firstCall = true;
  private balancesWorker: ModuleThread<BalancesWorker>;
  private votesWorker: ModuleThread<VotesWorker>;

  constructor(arweave: Arweave, daoGarden: DaoGarden) {
    this.arweave = arweave;
    this.daoGarden = daoGarden;
  }

  async open() {
    if(this.firstCall) {
      this.balancesWorker = await spawn<BalancesWorker>(new Worker('../workers/balances.ts'));
      this.votesWorker = await spawn<VotesWorker>(new Worker('../workers/votes.ts'));

      this.firstCall = false;
    }

    $('.link-home').addClass('active');
    $('.page-dashboard').show();
    this.syncPageState();
  }

  async close() {
    $('.link-home').removeClass('active');
    $('.page-dashboard').hide();
  }

  private async syncPageState() {
    const state = await this.daoGarden.getState();
    console.log(state);

    $('.page-header').find('.page-title').text(state.name);

    const {users, balance} = await this.balancesWorker.usersAndBalance(state.balances);
    const {vaultUsers, vaultBalance} = await this.balancesWorker.vaultUsersAndBalance(state.vault);

    const votes = await this.votesWorker.activeVotesByType(state.votes);
    const votesMint = votes.mint? votes.mint.length : 0;
    const votesVault = votes.mintLocked? votes.mintLocked.length : 0;
    const votesActive = votes.active? votes.active.length : 0;
    const votesAll = votes.all? votes.all.length : 0;

    $('.users').text(users.length);
    $('.users-vault').text(`${vaultUsers.length} `);
    $('.minted').text(balance + vaultBalance);
    $('.mint-waiting').text(`${votesMint} `);
    $('.vault').text(vaultBalance);
    $('.vault-waiting').text(`${votesVault} `);
    $('.ticker').text(` ${state.ticker} `);
    $('.votes').text(`${votesActive} `);
    $('.votes-completed').text(`${(votesAll - votesActive)} `);

    $('.dimmer').removeClass('active');
  }
}