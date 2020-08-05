import Arweave from 'arweave/web';
import Community from '../community-js/community';
import $ from '../libs/jquery';
import Account from '../models/account';
import Utils from '../utils/utils';
import { VoteType, VoteInterface } from '../community-js/faces';
import Toast from '../utils/toast';
import app from '../app';
import Vote from '../models/vote';

export default class PageVotes {
  private votes: Vote[] = [];

  constructor() {}

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
    const state = await app.getCommunity().getState();

    $('.min-lock-length').text(state.lockMinLength);
    $('.max-lock-length').text(state.lockMaxLength);

    $('.proposals').html('');
    console.log(state);
    if(state.votes.length) {
      for(let i = 0, j = state.votes.length; i < j; i++) {
        const vote = new Vote(state.votes[i], i);
        this.votes.push(vote);
        await vote.show();
      }
    }

    $('[data-toggle="tooltip"]').tooltip();
    $('.dimmer').removeClass('active');
  }

  private async setValidate() {
    const state = await app.getCommunity().getState();

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
    });

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

      const state = await app.getCommunity().getState();
      $('.input-max-lock').val(state.lockMaxLength);
    });

    $('#vote-set-value').on('input', async (e: any) => {
      await this.setValidate();
    });

    $('.do-vote').on('click', async (e: any) => {
      e.preventDefault();
      const state = await app.getCommunity().getState();

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
      $(e.target).addClass('btn-loading disabled');
      const toast = new Toast();
      try {
        const txid = await app.getCommunity().proposeVote(voteParams);
        toast.showTransaction('Create vote', txid, voteParams)
          .then(async () => {
            // Just create the new vote, do not sync the entire page.
            const state = await app.getCommunity().getState();

            const voteId = state.votes.length - 1;
            if(this.votes.length < state.votes.length) {
              const vote = new Vote(state.votes[this.votes.length], this.votes.length);
              this.votes.push(vote);
              await vote.show();
            }
          });

      } catch (err) {
        console.log(err.message);
        toast.show('Vote error', err.message, 'error', 3000);
      }

      $('#modal-new-vote').modal('hide');
      $(e.target).removeClass('btn-loading disabled');
    });
  }
  private async removeEvents() {
    $('input[name="voteType"], #vote-set-key').off('change');
    $('#vote-recipient, #vote-target, #vote-set-value').off('input');
    $('.btn-max-lock, .do-vote').off('click');
  }
}