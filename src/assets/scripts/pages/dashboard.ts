import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';

export default class PageDashboard {
  private arweave: Arweave;
  private daoGarden: DaoGarden;

  constructor(arweave: Arweave, daoGarden: DaoGarden) {
    this.arweave = arweave;
    this.daoGarden = daoGarden;
  }

  async open() {
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

    const users = Object.keys(state.balances);
    const balance = users.map(u => state.balances[u]).reduce((a, b) => a + b, 0);
    const vault = Object.keys(state.vault);
    let vaultBalance = 0;
    for(let i = 0, j = vault.length; i < j; i++) {
      vaultBalance += state.vault[vault[i]].map(a => a.balance).reduce((a, b) => a + b, 0);
    }

    let proposals = 0;
    let completedProposals = 0;
    let mintVotes = 0;
    let vaultVotes = 0;
    for(let i = 0, j = state.votes.length; i < j; i++) {
      const vote = state.votes[i];

      proposals++;
      if(vote.status === 'active') {
        completedProposals++;

        if(vote.type === 'mint') {
          mintVotes++;
        } else if(vote.type === 'mintLocked') {
          vaultVotes++;
        }
      }
    }

    $('.users').text(users.length);
    $('.users-vault').text(`${vault.length} `);
    $('.minted').text(balance + vaultBalance);
    $('.mint-waiting').text(`${mintVotes} `);
    $('.vault').text(vaultBalance);
    $('.vault-waiting').text(`${vaultVotes} `);
    $('.ticker').text(` ${state.ticker} `);
    $('.votes').text(`${proposals} `);
    $('.votes-completed').text(`${completedProposals} `);

    $('.dimmer').removeClass('active');
  }
}