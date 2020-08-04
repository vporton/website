import feather from 'feather-icons';
import Arweave from 'arweave/web';

import $ from '../libs/jquery';
import Utils from './utils';

export default class Toast {
  private t: any;

  show(title: string, message: string, type: 'error' | 'success' | 'none', duration: number = 500) {
    const autohide: boolean = duration > 0;

    const bg = type === 'error'? 'bg-red' : (type === 'success' ? 'bg-green' : 'bg-yellow');
    const icon = type === 'error'? feather.icons.x.toSvg() : (type === 'success'? feather.icons.check.toSvg() : '<div class="spinner-border spinner-border-sm" role="status"></div>');

    let closeBtn = '';
    if(duration > 0) {
      closeBtn = `
      <button type="button" class="ml-2 close" data-dismiss="toast" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>`;
    }

    const html = `
    <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true" data-autohide="${autohide}" data-delay="${duration}" data-toggle="toast">
      <div class="toast-header">
        <span class="avatar mr-2 ${bg} text-white">${icon}</span>
        <strong class="mr-auto">${title}</strong>
        ${closeBtn}
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
    `;

    this.t = $(html);
    $('.toast-container').append(this.t);
    this.t.toast('show');
  }

  async showTransaction(title: string, txid: string, data = {}, arweave: Arweave) {
    let message = `
    <div class="mb-2">
      <div class="strong">Transaction ID</div>
      <h5 class="text-muted">${txid}</h5>
    </div>
    `;

    for(let key in data) {
      message += `
      <div class="mb-2">
        <div class="strong">${await Utils.capitalize(key)}</div>
        <h5 class="text-muted">${data[key]}</h5>
      </div>`;
    }

    this.show(title, message, 'none', 0);
    await this.checkTransaction(txid, arweave);
  }

  hide() {
    this.t.toast('hide');
  }

  private async checkTransaction(txid: string, arweave: Arweave): Promise<void> {
    const res = await arweave.transactions.getStatus(txid);
    console.log(res);

    if (res.status !== 200 && res.status !== 202) {
      this.showFailTx();
      return;
    } else if(res.confirmed) {
      this.showSuccessTx();
      return;
    }

    await Utils.pause(15000);
    return this.checkTransaction(txid, arweave);
  }

  private async showSuccessTx() {
    this.showCloseBtn();
    this.t.find('.avatar').removeClass('bg-yellow').addClass('bg-green').html(feather.icons.check.toSvg());
  }

  private async showFailTx() {
    this.showCloseBtn();
    this.t.find('.avatar').removeClass('bg-yellow').addClass('bg-red').html(feather.icons.x.toSvg());
  }

  private async showCloseBtn() {
    this.t.find('.toast-header').append(`
    <button type="button" class="ml-2 close" data-dismiss="toast" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>`);
  }
}