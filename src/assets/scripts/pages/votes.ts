import Arweave from 'arweave/web';
import DaoGarden from '../daogarden-js/daogarden';
import $ from '../libs/jquery';
import Account from '../models/account';
import Utils from '../utils/utils';
import { VoteType, VoteInterface } from '../daogarden-js/faces';
import Toast from '../utils/toast';
import app from '../app';

export default class PageVotes {
  private daoGarden: DaoGarden;
  private account: Account;
  private arweave: Arweave;

  constructor(daoGarden: DaoGarden, account: Account, arweave: Arweave) {
    this.daoGarden = daoGarden;
    this.account = account;
    this.arweave = arweave;
  }

  async open() {
    $('.link-votes').addClass('active');
    $('.page-votes').show();
    this.syncPageState();
    this.events();
  }

  async close() {
    await this.removeEvents();
    $('.link-votes').removeClass('active');
    $('.page-votes').hide();
  }

  public async syncPageState() {
    const state = await this.daoGarden.getState();

    $('.min-lock-length').text(state.lockMinLength);
    $('.max-lock-length').text(state.lockMaxLength);

    $('.dimmer').removeClass('active');
  }

  private async showProposals(state) {
    let html = '';

    html += `<div class="col-md-6"><div class="card"><div class="progress progress-sm card-progress" data-toggle="tooltip" data-placement="top" title="" data-original-title="Vote ends in 40 blocks"><div class="progress-bar" style="width: 40%" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100"><span class="sr-only">40% complete</span></div></div><div class="card-body"><div class="float-right stamp bg-green text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div><div class="text-muted font-weight-normal mt-0 mb-3">Mint</div><div class="mb-3"><h3 class="mb-0">Recipient</h3><div class="d-flex lh-sm py-1 align-items-center">
    <span class="avatar mr-2" style="background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAADAFBMVEXw8PDYJs0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADFcKB+AAABAHRSTlP//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKmfXxgAAEEtJREFUeNoBQBC/7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAEBAQEBAQEBAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc64DIWrrKE0AAAAASUVORK5CYII=)"></span>
    <div class="flex-fill">
    <div class="strong">Cedrik</div>
    <div class="text-muted text-h5">BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU</div>
    </div>
    </div></div><div class="mb-3"><h3 class="mb-0">Quantity</h3><p class="text-muted">5,000 GARDEN</p></div><div class="mb-3"><h3 class="mb-0">Note</h3><p class="text-muted">Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...</p></div><div class="mb-3"><div class="row align-items-center"><div class="col text-muted">Yes</div><div class="col-auto ml-auto text-muted">39%</div></div><div class="progress"><div class="progress-bar bg-green" style="width: 39%"></div></div></div><div class="mb-3"><div class="row align-items-center"><div class="col text-muted">No</div><div class="col-auto ml-auto text-muted">10%</div></div><div class="progress"><div class="progress-bar bg-red" style="width: 10%"></div></div></div></div><div class="card-footer"><div class="row align-items-center"><div class="col"> <a class="btn btn-danger" href="#BAfcKVhykkup_onxxgzj3T0fMhp33bY82OK23Rruy-Q">NO</a><a class="btn btn-success ml-3" href="#BAfcKVhykkup_onxxgzj3T0fMhp33bY82OK23Rruy-Q">YES</a></div><div class="col-auto ml-auto"><div class="avatar-list avatar-list-stacked"><span class="avatar" style="background-image: url(/000m.ac0e04f1.jpg)"></span><span class="avatar">+5</span></div></div></div></div></div></div>`;

    $('.proposals').html(html + html + html);
  }

  private async setValidate() {
    const state = await this.daoGarden.getState();

    const recipient = $('#vote-recipient').val().trim();
    const setKey = $('#vote-set-key').val();
    let setValue = $('#vote-set-value').val().trim();

    if(setKey === 'quorum' || setKey === 'support') {
      setValue = +setValue;
      if(isNaN(setValue) || setValue < 1 || setValue > 99 || !Number.isInteger(setValue)) {
        return false;
      }
    } else if(setKey === 'lockMinLength' || setKey === 'lockMaxLength') {
      setValue = +setValue;
      if(isNaN(setValue) || setValue < 1 || !Number.isInteger(setValue)) {
        return false;
      }
      
      if(setKey === 'lockMinLength' && setValue > state.lockMaxLength) {
        $('.lock-set-value-invalid').text('Minimum lock length cannot be greater nor equal to the maximum lock length.');
        $('#vote-set-value').addClass('invalid');
        return false;
      } else if(setKey === 'lockMaxLength' && setValue < state.lockMinLength) {
        $('.lock-set-value-invalid').text('Maximum lock length cannot be lower nor equal to the minimum lock length.');
        $('#vote-set-value').addClass('invalid');
        return false;
      }
    } else if(setKey === 'role') {
      if(!Utils.isArTx(recipient)) {
        $('#vote-recipient').addClass('is-invalid');
        return false;
      }
      if(!setValue.length) {
        $('.lock-set-value-invalid').text('Need to type a role.');
        $('#vote-set-value').addClass('invalid');
        return false;
      }
    } else {
      return false;
    }

    $('#vote-set-value').removeClass('invalid');
    return true;
  }

  private async events() {
    $('input[name="voteType"]').on('change', (e: any) => {
      const voteType = $('input[name="voteType"]:checked').val();

      switch (voteType) {
        case 'mint':
          $('.vote-recipient, .vote-qty').show();
          $('.vote-fields, .vote-lock-length').hide();
          break;
        case 'mintLocked':
          $('.vote-recipient, .vote-qty, .vote-lock-length').show();
          $('.vote-fields').hide();
          break;
        case 'burnVault':
          $('.vote-recipient, .vote-qty, .vote-lock-length, .vote-fields').hide();
          $('.vote-burn-vault').show();
          break;
        case 'set':
          $('.vote-recipient, .vote-qty, .vote-lock-length, .vote-fields').hide();
          $('.vote-set').show();
          $('#vote-set-key').trigger('change');
          break;
        case 'indicative':
          $('.vote-recipient, .vote-qty, .vote-lock-length, .vote-fields').hide();
          break;
      }
    }).trigger('change');

    $('#vote-set-key').on('change', (e: any) => {
      const setKey = $(e.target).val();
      const $target = $('#vote-set-value').val('');

      $('.vote-recipient').hide();
      switch(setKey) {
        case 'role':
          $('.vote-recipient').show();
          $target.removeClass('input-number percent');
          break;
        case 'lockMinLength':
        case 'lockMaxLength':
          $target.addClass('input-number').removeClass('percent');
          break;
        case 'quorum':
        case 'support':
          $target.addClass('input-number percent');
          break;
      }
    }).trigger('change');

    $('#vote-recipient, #vote-target').on('input', async (e: any) => {
      const $target = $(e.target);
      const value = $target.val().trim();
      if(!await Utils.isArTx(value)) {
        $target.addClass('is-invalid');
      } else {
        $target.removeClass('is-invalid');
      }
    });

    $('.btn-max-lock').on('click', async (e: any) => {
      e.preventDefault();

      const state = await this.daoGarden.getState();
      $('.input-max-lock').val(state.lockMaxLength);
    });

    $('#vote-set-value').on('input', async (e: any) => {
      await this.setValidate();
    });

    $('.do-vote').on('click', async (e: any) => {
      e.preventDefault();
      const state = await this.daoGarden.getState();

      const voteType: VoteType = $('input[name="voteType"]:checked').val();
      const recipient = $('#vote-recipient').val().trim();
      const qty = +$('#vote-qty').val().trim();
      const length = +$('#vote-lock-length').val().trim();
      const target = $('#vote-target').val().trim();
      const setKey = $('#vote-set-key').val();
      let setValue = $('#vote-set-value').val().trim();
      const note = $('#vote-note').val().trim();

      let voteParams: VoteInterface = {
        type: voteType
      };

      console.log(qty);

      if(voteType === 'mint' || voteType === 'mintLocked') {
        if(!await Utils.isArTx(recipient)) {
          $('#vote-recipient').addClass('is-invalid');
          return;
        }
        if(qty < 1 || !Number.isInteger(qty)) {
          return;
        }

        voteParams['recipient'] = recipient;
        voteParams['qty'] = qty;

        if(voteType === 'mintLocked') {
          if(isNaN(length) || !Number.isInteger(length) || length < state.lockMinLength || length > state.lockMaxLength) {
            return;
          }
          voteParams['lockLength'] = length;
        }
      } else if(voteType === 'burnVault') {
        if(!Utils.isArTx(target)) {
          $('#vote-target').addClass('is-invalid');
          return;
        }
        voteParams['target'] = target;
      } else if(voteType === 'set') {
        if(!await this.setValidate()) {
          return;
        }
        
        voteParams['key'] = setKey;
        voteParams['value'] = setValue;
      }

      if(!note.length) {
        $('#vote-note').addClass('is-invalid');
        return;
      }
      voteParams['note'] = note;
      console.log(typeof note);

      // All validations passed
      $(e.target).addClass('disabled').html('<div class="spinner-border spinner-border-sm" role="status"></div>');
      const toast = new Toast();
      try {
        const txid = await this.daoGarden.proposeVote(voteParams);
        toast.showTransaction('Create vote', txid, voteParams, this.arweave)
          .then(() => {
            app.getCurrentPage().syncPageState();
          });

      } catch (err) {
        console.log(err.message);
        toast.show('Transfer error', err.message, 'error', 3000);
      }

      $('#modal-new-vote').modal('hide');
      $(e.target).removeClass('disabled').text('Transfer tokens');
    });
  }
  private async removeEvents() {
    $('input[name="voteType"], #vote-set-key').off('change');
    $('#vote-recipient, #vote-target, #vote-set-value').off('input');
    $('.btn-max-lock, .do-vote').off('click');
  }
}