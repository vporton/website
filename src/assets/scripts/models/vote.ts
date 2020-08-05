import feather from 'feather-icons';
import { get, getIdenticon } from 'arweave-id';

import $ from '../libs/jquery';
import { VoteInterface, VoteStatus, VoteType } from "../daogarden-js/faces";
import app from '../app';
import Utils from '../utils/utils';
import Toast from '../utils/toast';

export default class Vote implements VoteInterface {
  status?: VoteStatus;
  type?: VoteType;
  id?: number;
  totalWeight?: number;
  recipient?: string;
  target?: string;
  qty?: number;
  key?: string;
  value?: any;
  note?: string;
  yays?: number;
  nays?: number;
  voted?: string[];
  start?: number;
  lockLength?: number;

  voteId: number;
  $card: any;
  
  constructor(params: VoteInterface = {}, voteId: number) {
    if(Object.keys(params).length) {
      params = Utils.stripTags(params);
      for(let key in params) {
        this[key] = params[key];
      }
    }

    this.voteId = voteId;
  }

  async sync() {
    const me = await app.getAccount().getAddress();
    const state = await app.getDaoGarden().getState();
    const ends = (+this.start) + state.voteLength;
    const current = app.getCurrentBlock();
    const endsIn = current < ends? ends-current : 0;

    const $progress = this.$card.find('.blocks-progress');
    if($progress.css('width') !== '100%') {
      let percent = 100;
      if(current < ends) {
        percent = (current-this.start) / (ends-this.start) * 100;
      }
      $progress.css('width', `${percent}%`).parent().attr('title', `Vote ends in ${endsIn}`).attr('data-original-title', `Vote ends in ${endsIn}`).find('.sr-only').text(`Vote ends in ${endsIn}`);
    }

    /**
     * <div class="progress progress-sm card-progress" data-toggle="tooltip" data-placement="top" title="Vote ends in ${endsIn} blocks" data-original-title="Vote ends in ${endsIn} blocks">
          <div class="progress-bar" style="width: ${percent}%" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
            <span class="sr-only">Vote ends in ${endsIn} blocks</span>
          </div>
        </div>
     */

     setTimeout(() => this.sync(), 60000);
  }

  async show() {
    const me = await app.getAccount().getAddress();
    const state = await app.getDaoGarden().getState();
    const ends = (+this.start) + state.voteLength;
    const current = app.getCurrentBlock();
    const endsIn = current < ends? ends-current : 0;

    let percent = 100;
    if(current < ends) {
      percent = (current-this.start) / (ends-this.start) * 100;
    }

    const bgColor = this.type === 'mint'? 'lime' : (
      this.type === 'mintLocked'? 'green' : (
        this.type === 'burnVault'? 'red' : (
          this.type === 'set'? 'blue' : 'yellow'
        )
      )
    );
    const icon = this.type === 'mint'? feather.icons.users.toSvg() : (
      this.type === 'mintLocked' || this.type === 'burnVault'? feather.icons.lock.toSvg() : (
        this.type === 'set'? feather.icons.settings.toSvg() : feather.icons['help-circle'].toSvg()
      )
    );

    let details = '';
    if(this.type === 'mint' || this.type === 'mintLocked' || this.type === 'burnVault') {
      const arId = await get(this.recipient || this.target, app.getArweave());
      let avatar = arId.avatarDataUri || getIdenticon(this.recipient || this.target);
      details = `
      <div class="mb-3">
        <h3 class="mb-0">${this.type === 'burnVault' ? 'Target' : 'Recipient'}</h3>
        <div class="d-flex lh-sm py-1 align-items-center">
          <span class="avatar mr-2" style="background-image: url(${avatar})"></span>
          <div class="flex-fill">
            <div class="strong">${arId.name || (this.recipient || this.target)}</div>
            <div class="text-muted text-h5">${this.recipient || this.target}</div>
          </div>
        </div>
      </div>`;
    }
    if(this.type === 'mint' || this.type === 'mintLocked') {
      details += `
      <div class="mb-3">
        <h3 class="mb-0">Quantity</h3>
        <p class="text-muted">${Utils.formatMoney(this.qty, 0)} ${state.ticker}</p>
      </div>`;
    }
    if(this.type === 'mintLocked') {
      details += `
      <div class="mb-3">
        <h3 class="mb-0">Lock length</h3>
        <p class="text-muted">${Utils.formatMoney(this.lockLength, 0)} blocks</p>
      </div>`;
    }
    if(this.type === 'set') {
      const val = this.key === 'quorum' || this.key === 'support'? `${this.value*100}%` : this.value;
      details += `
      <div class="mb-3">
        <h3 class="mb-0">Key</h3>
        <p class="text-muted">${await Utils.capitalize(this.key)}</p>
      </div>
      <div class="mb-3">
        <h3 class="mb-0">Value</h3>
        <p class="text-muted">${await Utils.capitalize(val)}</p>
      </div>`;
    }

    let yaysPercent = 0;
    let naysPercent = 0;
    const total = this.yays + this.nays;
    if(total > 0) {
      yaysPercent = Math.round(this.yays / total) * 100;
      naysPercent = Math.round(this.nays / total) * 100;
    }

    let footerBtns = `
    <a class="btn-vote-no btn btn-danger" href="#">NO</a>
    <a class="btn-vote-yes btn btn-success ml-3" href="#">YES</a>`;
    if(!endsIn) {
      if(this.status === 'active') {
        footerBtns = `<a href="#" class="btn-finalize btn btn-dark">Finalize</a>`;
      } else {
        footerBtns = await Utils.capitalize(this.status);
      }
    } else if(this.voted.length && this.voted.includes(me)) {
      footerBtns = `<a class="btn btn-light disabled" href="#">Already Voted</a>`;
    }

    let avatarList = '';
    if(this.voted.length) {
      const maxLength = this.voted.length > 5? 5 : this.voted.length;
      for(let i = 0, j = maxLength; i < j; i++) {
        const arId = await get(this.voted[i], app.getArweave());
        const avatar = arId.avatarDataUri || getIdenticon(this.voted[i]);
        avatarList += `<span class="avatar" style="background-image: url(${avatar})"></span>`;
      }

      if(this.voted.length > 5) {
        avatarList += `<span class="avatar">+${(5 - this.voted.length)}</span>`;
      }
    }

    const endsInStr = Utils.formatMoney(endsIn);
    this.$card = $(`<div class="col-md-6">
      <div class="card">
        <div class="progress progress-sm card-progress" data-toggle="tooltip" data-placement="top" title="Vote ends in ${endsInStr} blocks" data-original-title="Vote ends in ${endsIn} blocks">
          <div class="progress-bar blocks-progress" style="width: ${percent}%" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
            <span class="sr-only">Vote ends in ${endsInStr} blocks</span>
          </div>
        </div>
        <div class="card-body">
          <div class="float-right stamp bg-${bgColor} text-white">${icon}</div>
          <div class="text-muted font-weight-normal mt-0 mb-3">#${this.voteId}. ${await Utils.capitalize(this.type)}</div>
          ${details}
          <div class="mb-3">
            <h3 class="mb-0">Note</h3>
            <p class="text-muted">${this.note}</p>
          </div>
          <div class="mb-3">
            <div class="row align-items-center">
              <div class="col text-muted">Yes</div>
              <div class="col-auto ml-auto text-muted">${yaysPercent}%</div>
            </div>
            <div class="progress">
              <div class="progress-bar bg-green" style="width: ${yaysPercent}%"></div>
            </div>
          </div>
          <div class="mb-3">
            <div class="row align-items-center">
              <div class="col text-muted">No</div>
              <div class="col-auto ml-auto text-muted">${naysPercent}%</div>
            </div>
            <div class="progress">
              <div class="progress-bar bg-red" style="width: ${naysPercent}%"></div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div class="row align-items-center">
            <div class="col">
              ${footerBtns}
            </div>
            <div class="col-auto ml-auto">
              <div class="avatar-list avatar-list-stacked">
                ${avatarList}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`);

    $('.proposals').prepend(this.$card);
    this.setEvents();

    setTimeout(() => this.sync(), 60000);
  }

  private setEvents() {
    this.$card.on('click', '.btn-vote-yes', async (e: any) => {
      e.preventDefault();

      if(!await app.getAccount().isLoggedIn()) {
        return await app.getAccount().showLoginError();
      }

      $(e.target).addClass('btn-loading disabled');
      this.$card.find('.btn-vote-no').addClass('disabled');

      const toast = new Toast();
      try {
        const txid = await app.getDaoGarden().vote(this.voteId, 'yay');
        toast.showTransaction('Vote', txid, {voteId: this.voteId, cast: 'Yes'}, app.getArweave())
          .then(() => {
            this.sync();
          });
        $(e.target).removeClass('btn-loading');
      } catch (err) {
        console.log(err.message);
        toast.show('Vote error', err.message, 'error', 3000);
        $(e.target).removeClass('btn-loading disabled');
      }

      
    });

    this.$card.on('click', '.btn-vote-no', async (e: any) => {
      e.preventDefault();

      if(!await app.getAccount().isLoggedIn()) {
        return await app.getAccount().showLoginError();
      }

      $(e.target).addClass('btn-loading disabled');
      this.$card.find('.btn-vote-yes').addClass('disabled');

      const toast = new Toast();
      try {
        const txid = await app.getDaoGarden().vote(this.voteId, 'nay');
        toast.showTransaction('Vote', txid, {voteId: this.voteId, cast: 'No'}, app.getArweave())
          .then(() => {
            this.sync();
          });
        $(e.target).removeClass('btn-loading');
      } catch (err) {
        console.log(err.message);
        toast.show('Vote error', err.message, 'error', 3000);
        $(e.target).removeClass('btn-loading disabled');
      }

    });

    this.$card.on('click', '.btn-finalize', async (e: any) => {
      e.preventDefault();

      if(!await app.getAccount().isLoggedIn()) {
        return await app.getAccount().showLoginError();
      }

      $(e.target).addClass('btn-loading disabled');
      const toast = new Toast();
      try {
        const txid = await app.getDaoGarden().finalize(this.voteId);
        toast.showTransaction('Finalize vote', txid, {voteId: this.voteId}, app.getArweave())
          .then(() => {
            this.sync();
          });
        $(e.target).removeClass('btn-loading');
      } catch (err) {
        console.log(err.message);
        toast.show('Vote error', err.message, 'error', 3000);
        $(e.target).removeClass('btn-loading disabled');
      }

    });
  }
}