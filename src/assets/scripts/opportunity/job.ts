import jobboard from "./jobboard";
import Opportunity from "../models/opportunity";
import Utils from "../utils/utils";
import Applicant from "../models/applicant";
import Toast from "../utils/toast";
import moment from "moment";
import { getIdenticon, get } from "../utils/arweaveid";

export default class PageJob {
  private opportunity: Opportunity;

  getOpportunity(): Opportunity {
    return this.opportunity;
  }

  async open() {
    $('.jobboard-job').show();

    const oppId = jobboard.getHashes()[0];
    this.opportunity = await Opportunity.getOpportunity(oppId, jobboard.getArweave());

    if(!this.opportunity) {
      window.location.hash = '';
    }

    await this.show();
    this.events();
  }
  async close() {
    this.opportunity = null;
    $('.opp-description').html('').parents('.dimmer').addClass('active');
    await this.removeEvents();
    $('.jobboard-job').hide();
  }

  async syncPageState() {
    // @ts-ignore
    if(await jobboard.getAccount().isLoggedIn() && this.opportunity.author === await jobboard.getAccount().getAddress()) {
      $('.is-owner').show();
      $('.is-not-owner').hide();
      $('.btn-opp-status').removeClass('disabled');
    } else {
      $('.is-owner').hide();
      $('.is-not-owner').show();
      $('.btn-opp-status').addClass('disabled');
    }

    $('.btn-opp-status').removeClass('btn-dark btn-danger').addClass('btn-primary').text(this.opportunity.status);
    switch(this.opportunity.status) {
      case 'Closed':
        $('.btn-opp-status').removeClass('btn-primary').addClass('disabled btn-danger');
        break;
      case 'Finished':
        $('.btn-opp-status').removeClass('btn-primary').addClass('disabled btn-dark');
        break;
    }
  }

  private async show() {
    await this.syncPageState();
    if(this.opportunity.status === 'Closed' || this.opportunity.status === 'Finished') {
      $('.is-not-ended').hide();
    } else {
      $('.is-not-ended').show();
    }

    const lock = this.opportunity.lockLength? `Locked: ${Utils.formatMoney(this.opportunity.lockLength, 0)} blocks` : '';

    $('.opp-title').text(this.opportunity.title);
    $('.opp-project').text(this.opportunity.project);
    $('.opp-experience').text(this.opportunity.experience);
    $('.opp-commitment').text(this.opportunity.commitment);
    $('.opp-type').text(this.opportunity.type);
    $('.opp-payout').text(Utils.formatMoney(+this.opportunity.payout, 0));
    $('.opp-lock-length').text(lock);
    $('.opp-community').text(this.opportunity.community.name).attr('href', `./index.html#${this.opportunity.community.id}`);
    $('.opp-community-ticker').text(this.opportunity.community.ticker);
    $('.opp-timestamp').text(moment(this.opportunity.timestamp).fromNow());
    $('.btn-contact-creator').attr('href', `https://wqpddejmpwo6.arweave.net/RlUqMBb4NrvosxXV6e9kQkr2i4X0mqIAK49J_C3yrKg/index.html#/inbox/to=${this.opportunity.author}`);
    
    $('.sidebar').removeClass('active');

    this.showApplicants();

    get(this.opportunity.author).then(author => {
      $('.creator-addy').attr('data-original-title', this.opportunity.author).text(author.name || this.opportunity.author);
      $('[data-toggle="tooltip"]').tooltip();

      const avatar = author.avatarDataUri || getIdenticon(this.opportunity.author);
      $('.creator-avatar').css('background-image', `url(${avatar})`);
    });

    jobboard.getArweave().api.get(`/${this.opportunity.id}`).then(res => {
      const $editor = $('<div class="ql-editor"></div>').html(Utils.escapeScriptStyles(res.data));
      $('.opp-description').html('').append($editor).parents('.dimmer').removeClass('active');
    });
  }

  private async showApplicants() {
    //$('.opp-applicants').html('').parents('.dimmer').addClass('active');

    // @ts-ignore
    const applicants: Applicant[] = await Applicant.getAll(this.opportunity.id);
    $('.total-applications').text(`${applicants.length} ${applicants.length === 1? 'applicant': 'applicants'}`);
    let html = '';
    for(let i = 0, j = applicants.length; i < j; i++) {
      const applicant = applicants[i];
      html += `
        <div class="card" data-applicant-id="${applicant.id}">
          <div class="card-body">
            <div class="row row-sm">
              <div class="col-auto">
                <span class="avatar avatar-md" style="background-image: url(${applicant.avatar})"></span>
              </div>
              <div class="col">
                <h4 class="card-title m-0 d-inline" data-toggle="tooltip" data-original-title="${applicant.address}">${applicant.username}</h4>
                <div class="mb-2">
                  <a class="btn btn-sm btn-light mr-2" href="https://wqpddejmpwo6.arweave.net/RlUqMBb4NrvosxXV6e9kQkr2i4X0mqIAK49J_C3yrKg/index.html#/inbox/to=${applicant.address}" target="_blank">Contact on WeveMail</a>
                </div>
                <div class="small mt-1">${applicant.message}</div>
              </div>
            </div>
          </div>
        </div>`;
    }

    if(!applicants.length) {
      html = `
      <div class="card">
        <div class="card-body">
          This opportunity doesn't have any applications. <a class="btn-apply" href="#">Be the first to apply.</a>
        </div>
      </div>`;
    }

    $('.opp-applicants').html(html).parents('.dimmer').removeClass('active');
    $('[data-toggle="tooltip"]').tooltip();
  }

  private async events() {
    $('.change-status').on('click', 'a', async e => {
      e.preventDefault();

      const status = $(e.target).text().trim();
      console.log(status);

      await this.opportunity.update({ status });
    });

    $('body').on('click', '.btn-apply', async e => {
      e.preventDefault();

      if(!await jobboard.getAccount().isLoggedIn() || await jobboard.getAccount().getAddress() === this.opportunity.author) {
        alert('Please login first.');
        return;
      }

      $('#modal-apply').modal('show');
    });

    // $('#apply-twitter').on('input', e => {
    //   if($(e.target).val().toString().includes('/')) {
    //     $(e.target).addClass('is-invalid');
    //   } else {
    //     $(e.target).removeClass('is-invalid');
    //   }
    // });
    // $('#apply-github').on('input', e => {
    //   if(!$(e.target).val().toString().startsWith('https://github.com/')) {
    //     $(e.target).addClass('is-invalid');
    //   } else {
    //     $(e.target).removeClass('is-invalid');
    //   }
    // });

    $('.do-apply').on('click', async e => {
      e.preventDefault();

      $(e.target).addClass('btn-loading');

      const message = $('<div></div>').append($('#apply-message').val().toString().trim()).text();

      if(!await jobboard.chargeFee('OpportunityApplication')) {
        alert('Unable to submit transaction, please try again later.');
        return;
      }

      const arweave = jobboard.getArweave();
      const wallet = await jobboard.getAccount().getWallet();
      const tx = await arweave.createTransaction({data: message}, wallet);

      tx.addTag('App-Name', 'CommunityXYZ');
      tx.addTag('Action', 'Application');
      tx.addTag('Opportunity-ID', this.opportunity.id);
      await arweave.transactions.sign(tx, wallet);
      const res = await arweave.transactions.post(tx);
      if (res.status !== 200 && res.status !== 202) {
        console.log(res);
        alert('Unable to submit transaction, please try again later.');
        $(e.target).removeClass('btn-loading');
        return;
      }

      $(e.target).removeClass('btn-loading');
      $('#modal-apply').modal('hide');

      const toast = new Toast(arweave);
      toast.showTransaction('Apply', tx.id, {OpportunityId: this.opportunity.id}).then(() => {
        this.showApplicants();
      });
      
    });
  }

  private async removeEvents() {
    $('.change-status, .do-apply, body').off('click');
    $('#apply-twitter, #apply-github').off('input');
  }
}