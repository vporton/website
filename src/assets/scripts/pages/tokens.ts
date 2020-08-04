import Arweave from 'arweave/web';
import ApexCharts from 'apexcharts';
import { ModuleThread, spawn } from 'threads';
import * as arweaveId from 'arweave-id';

import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';
import { BalancesWorker } from '../workers/balances';
import { TokensWorker } from '../workers/tokens';
import { StateInterface } from '../daogarden-js/faces';
import Utils from '../utils/utils';
import Account from '../models/account';
import Toast from '../utils/toast';
import app from '../app';

export default class PageTokens {
  private daoGarden: DaoGarden;
  private account: Account;
  private arweave: Arweave;

  private chart: ApexCharts;

  // workers
  private firstCall = true;
  private balancesWorker: ModuleThread<BalancesWorker>;
  private tokensWorker: ModuleThread<TokensWorker>;

  constructor(daoGarden: DaoGarden, account: Account, arweave: Arweave) {
    this.daoGarden = daoGarden;
    this.account = account;
    this.arweave = arweave;
  }

  async open() {
    if(this.firstCall) {
      this.balancesWorker = await spawn<BalancesWorker>(new Worker('../workers/balances.ts'));
      this.tokensWorker = await spawn<TokensWorker>(new Worker('../workers/tokens.ts'));

      this.firstCall = false;
    }

    $('.link-tokens').addClass('active');
    $('.page-tokens').show();
    this.syncPageState();

    this.events();
  }

  async close() {
    $('.link-tokens').removeClass('active');
    $('.page-tokens').hide();

    await this.removeEvents();
  }

  public async syncPageState() {
    const state = await this.daoGarden.getState();

    const {balance} = await this.balancesWorker.usersAndBalance(state.balances);
    const {vaultBalance} = await this.balancesWorker.vaultUsersAndBalance(state.vault);

    $('.ticker').text(state.ticker);
    $('.minted').text(Utils.formatMoney(balance + vaultBalance, 0));
    $('.vault').text(Utils.formatMoney(vaultBalance, 0));
    $('.minted').parents('.dimmer').removeClass('active');
    
    const holdersByBalance = await this.tokensWorker.sortHoldersByBalance(state.balances, state.vault);
    this.createOrUpdateCharts(holdersByBalance, state, balance);
    this.createOrUpdateTable(holdersByBalance, state);

    const bal = await this.balancesWorker.getAddressBalance((await this.account.getAddress()), state.balances, state.vault);
    $('.user-unlocked-balance').text(Utils.formatMoney(bal, 0));

    const transferFee = await this.daoGarden.getActionCost(true, {formatted: true, decimals: 5, trim: true});
    $('.tx-fee').text(` ${transferFee} `);
  }

  private async events() {
    $('.btn-max-balance').on('click', async (e: any) => {
      e.preventDefault();

      $('.input-max-balance').val(await this.account.getUnlockedBalance());
    });

    $('.do-transfer-tokens').on('click', async (e: any) => {
      e.preventDefault();

      const $target = $('#transfer-target');
      const $balance = $('#transfer-balance');
      if($target.hasClass('is-invalid') || $balance.hasClass('is-invalid')) {
        return;
      }

      const transferTarget = $target.val().trim();
      const transferBalance = +$balance.val().trim();

      if(isNaN(transferBalance) || transferBalance < 1) {
        return;
      }

      $(e.target).addClass('disabled').html('<div class="spinner-border spinner-border-sm" role="status"></div>');

      const toast = new Toast();
      try {
        const txid = await this.daoGarden.transfer(transferTarget, transferBalance);
        toast.showTransaction('Transfer balance', txid, {target: transferTarget, amount: Utils.formatMoney(transferBalance, 0)}, this.arweave)
          .then(() => {
            app.getCurrentPage().syncPageState();
          });

      } catch (err) {
        console.log(err.message);
        const toast = new Toast();
        toast.show('Transfer error', err.message, 'error', 3000);
      }

      $('#modal-transfer').modal('hide');
      $(e.target).removeClass('disabled').text('Transfer tokens');
    });

    $('#transfer-target').on('input', async (e: any) => {
      const $target = $(e.target);
      const transferTarget = $target.val().trim();
      if(!(await Utils.isArTx(transferTarget)) || transferTarget === (await this.account.getAddress())) {
        $target.addClass('is-invalid');
      } else {
        $target.removeClass('is-invalid');
      }
    });
  }

  private async removeEvents() {
    $('.btn-max-balance, .do-transfer-tokens').off('click');
    $('#transfer-target').off('input');
  }

  private async createOrUpdateTable(holders: {
    address: string;
    balance: number;
    vaultBalance: number;
}[], state: StateInterface): Promise<void> {
    let html = '';

    for(let i = 0, j = holders.length; i < j; i++) {
      const holder = holders[i];
      const arId = await this.account.getArweaveId(holder.address);
      const avatar = arId.avatarDataUri || arweaveId.getIdenticon(holder.address);
      const balance = holder.balance > holder.vaultBalance? holder.balance-holder.vaultBalance : holder.vaultBalance-holder.balance;

      let role = '-';
      if(holder.address in state.roles) {
        role = state.roles[holder.address];
      }

      html += `<tr data-holder='${JSON.stringify(holder)}'>
        <td data-label="Token Holder">
          <div class="d-flex lh-sm py-1 align-items-center">
            <span class="avatar mr-2" style="background-image: url(${avatar})"></span>
            <div class="flex-fill">
              <div class="strong">${arId.name || holder.address}</div>
              <div class="text-muted text-h5">${holder.address}</div>
            </div>
          </div>
        </td>
        <td class="text-muted" data-label="Balance">
          ${Utils.formatMoney(balance, 0)}
        </td>
        <td class="text-muted" data-label="Vault Balance">${Utils.formatMoney(holder.vaultBalance, 0)}</td>
        <td class="text-muted" data-label="Total Balance">${Utils.formatMoney(holder.balance, 0)}</td>
        <td class="text-muted d-none d-lg-table-cell" data-label="Role">${role}</td>
        <td class="text-right">
          <span class="dropdown ml-1">
            <button class="btn btn-light dropdown-toggle align-text-top" data-boundary="viewport" data-toggle="dropdown">Actions</button>
            <div class="dropdown-menu dropdown-menu-right">
              <a class="dropdown-item" href="#">Transfer</a>
              <a class="dropdown-item" href="#">Mint</a>
              <a class="dropdown-item" href="#">Mint Locked</a>
              <a class="dropdown-item" href="#">Burn</a>
            </div>
          </span>
        </td>
      </tr>`;
    }

    $('.token-holders').find('tbody').html(html).parents('.dimmer').removeClass('active');
  }

  private async createOrUpdateCharts(holders: {address: string, balance: number}[], state: StateInterface, balance: number) {
    if(!this.chart) {
      this.chart = new ApexCharts(document.getElementById('chart-total-tokens'), {
        chart: {
          type: 'donut',
          fontFamily: 'inherit',
          height: 175,
          sparkline: {
            enabled: true
          },
          animations: {
            enabled: true
          }
        },
        fill: { opacity: 1 },
        title: {
          text: 'Top Holders'
        },
        labels: [],
        series: [],
        noData: { 
          text: 'Loading...'
        },
        grid: {
          strokeDashArray: 4
        },
        //colors: ["#206bc4", "#79a6dc", "#bfe399", "#e9ecf1"],
        legend: { show: false },
        tooltip: { fillSeriesColor: false },
        yaxis: {
          labels: {
            formatter: (val) => `${val}%`
          }
        }
      });
      this.chart.render();
    }

    const data: {x: string, y: number}[] = [];
    const labels: string[] = [];
    const series: number[] = [];

    const maxChartHolders = holders.length > 5? 5 : holders.length;
    for(let i = 0, j = maxChartHolders; i < j; i++) {
        labels.push(holders[i].address);
        series.push(holders[i].balance / balance * 100);
    }


    this.chart.updateSeries(series);
    this.chart.updateOptions({
      labels
    });

    $('#chart-total-tokens').parents('.dimmer').removeClass('active');
  }
}