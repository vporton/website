import feather from 'feather-icons';
import { get, getIdenticon } from 'arweave-id';

import $ from '../libs/jquery';
import { VoteInterface, VoteStatus, VoteType } from "../daogarden-js/faces";
import app from '../app';
import Utils from '../utils/utils';

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

  $card: any;
  
  constructor(params: VoteInterface = {}) {
    if(Object.keys(params).length) {
      const tmp = document.createElement('div');
      for(let key in params) {
        tmp.innerHTML = key;
        const k = tmp.textContent || tmp.innerText || '';
        tmp.innerHTML = params[key];
        const v = tmp.textContent || tmp.innerText || '';

        this[k] = v;
      }
    }
  }

  async sync() {}

  async show() {
    const me = await app.getAccount().getAddress();
    const state = await app.getDaoGarden().getState();
    const ends = (+this.start) + state.voteLength;
    const current = app.getCurrentBlock();
    const endsIn = current < ends? ends-current : 0;

    let percent = 100;
    if(current < ends) {
      percent = Math.round((current-this.start) / (ends-this.start)) * 100;
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
    <a class="btn-vote-yes btn btn-danger" href="#">NO</a>
    <a class="btn-vote-no btn btn-success ml-3" href="#">YES</a>`;
    if(this.voted.length && (me in this.voted)) {
      footerBtns = `<a class="btn btn-light disabled" href="#">Already Voted</a>`;
    }

    let avatarList = '';
    if(this.voted.length) {
      const maxLength = this.voted.length > 5? 5 : this.voted.length;
      for(let i = 0, j = maxLength; i < j; i++) {
        const arId = await get(this.recipient || this.target, app.getArweave());
        const avatar = arId.avatarDataUri || getIdenticon(this.recipient || this.target);
        avatarList += `<span class="avatar" style="background-image: url(${avatar})"></span>`;
      }

      if(this.voted.length > 5) {
        avatarList += `<span class="avatar">+${(5 - this.voted.length)}</span>`;
      }
    }

    this.$card = `<div class="col-md-6">
      <div class="card">
        <div class="progress progress-sm card-progress" data-toggle="tooltip" data-placement="top" title="Vote ends in ${endsIn} blocks" data-original-title="Vote ends in ${endsIn} blocks">
          <div class="progress-bar" style="width: ${percent}%" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
            <span class="sr-only">Vote ends in ${endsIn} blocks</span>
          </div>
        </div>
        <div class="card-body">
          <div class="float-right stamp bg-${bgColor} text-white">${icon}</div>
          <div class="text-muted font-weight-normal mt-0 mb-3">${await Utils.capitalize(this.type)}</div>
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
    </div>`;

    $('.proposals').prepend(this.$card);
  }
}