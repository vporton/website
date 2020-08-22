import "quill/dist/quill.snow.css";
import Quill from 'quill';
import jobboard from './jobboard';
import Utils from "../utils/utils";
import { OpportunityCommunityInterface } from '../interfaces/opportunity';
import Transaction from "arweave/node/lib/transaction";
import Toast from "../utils/toast";

export default class PageCreateJob {
  private isCurrentPage: boolean = false;
  private quill: Quill;
  private tx: Transaction;

  private community: OpportunityCommunityInterface = {
    id: '',
    name: '',
    ticker: ''
  };

  async open() {
    this.isCurrentPage = true;

    if(!this.quill) {
      const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block', 'link'],
      
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      
        [{ 'size': [false, 'large', 'huge'] }],
      
        ['clean']                                         // remove formatting button
      ];

      this.quill = new Quill('#quill-editor', {
        modules: {
          toolbar: toolbarOptions
        },
        theme: 'snow'
      });

      $('.ql-editor').css('min-height', 150);
    }

    $('.jobboard-create').show();
    this.events();
  }

  async close() {
    await this.removeEvents();
    $('.jobboard-create').hide();
  }

  async syncPageState() {
    if(!await jobboard.getAccount().isLoggedIn()) {
      window.location.hash = '';
    }
  }

  private async updateCommunity($target: any, val: string) {
    $target.removeClass('is-invalid');
    $target.prop('disabled', true).siblings('.input-icon-addon').show();
    this.community.id = val;

    try {
      await jobboard.getCommunity().setCommunityTx(val);
      const state = await jobboard.getCommunity().getState();

      this.community.name = state.name;
      this.community.ticker = state.ticker;
  
      $('.community-name').text(state.name);
      $('.ticker').text(state.ticker);
    } catch (err) {
      // @ts-ignore
      this.community = {};
      $('.community-name').text('');
      $('.ticker').text('');

      $target.addClass('is-invalid');
    }

    $target.prop('disabled', false).siblings('.input-icon-addon').hide();
  }

  private async submit() {
    const title = $.trim(Utils.stripHTML($('#job-title').val().toString()));
    const amount = +$.trim(Utils.stripHTML($('#job-amount').val().toString()));
    const description = $.trim(Utils.escapeScriptStyles(this.quill.root.innerHTML));
    const jobType = $.trim(Utils.stripHTML($('[name="job-type"]:checked').val().toString()));
    const expLevel = $.trim(Utils.stripHTML($('[name="job-exp"]:checked').val().toString()));
    const commitment = $.trim(Utils.stripHTML($('[name="job-commitment"]:checked').val().toString()));
    const project = $.trim(Utils.stripHTML($('[name="job-project"]:checked').val().toString()));
    const permission = $.trim(Utils.stripHTML($('[name="permission"]:checked').val().toString()));

    if(title.length < 3) {
      alert('The title doesn\'t explain what is this opportunity.');
      return;
    }

    if(!this.community.id || !await Utils.isArTx(this.community.id) || !this.community.name.length) {
      alert('There seems to be an issue with your community ID. Please type it again.');
      return;
    }

    if(!$(this.quill.root).text().trim().length) {
      alert('Description is required.');
      return;
    }

    if(isNaN(amount) || amount < 1) {
      alert('Invalid payout amount.');
      return;
    }

    // Create the transaction
    this.tx = await jobboard.getArweave().createTransaction({data: description}, await jobboard.getAccount().getWallet());
    this.tx.addTag('Content-Type', 'text/html');
    this.tx.addTag('App-Name', 'CommunityXYZ');
    this.tx.addTag('Action', 'addOpportunity');
    this.tx.addTag('title', title);
    this.tx.addTag('jobType', jobType);
    this.tx.addTag('expLevel', expLevel);
    this.tx.addTag('commitment', commitment);
    this.tx.addTag('project', project);
    this.tx.addTag('permission', permission);
    this.tx.addTag('payout', amount.toString());

    this.tx.addTag('communityId', this.community.id);
    this.tx.addTag('communityName', this.community.name);
    this.tx.addTag('communityTicker', this.community.ticker);

    let cost = await jobboard.getArweave().transactions.getPrice(new Blob([description]).size);
    cost = jobboard.getArweave().ar.winstonToAr(cost, {formatted: true, decimals: 5, trim: true});

    $('.fee').text((+cost) + (+jobboard.getFee()));
    $('#confirm-modal').modal('show');

  }

  private async events() {
    $('#job-community').on('input', async (e: any) => {
      const val = $(e.target).val().toString().trim();
      if(!await Utils.isArTx(val)) {
        // @ts-ignore
        this.community = {};
        $('.community-name').text('');
        $('.ticker').text('');

        $(e.target).addClass('is-invalid');
        return;
      }

      this.updateCommunity($(e.target), val);
    });

    $('.submit-job').on('click', async (e: any) => {
      e.preventDefault();

      await this.submit();
    });
    $('.confirm-tx').on('click', async (e: any) => {
      e.preventDefault();

      const arweave = jobboard.getArweave();
      await arweave.transactions.sign(this.tx, await jobboard.getAccount().getWallet());
      const txid = this.tx.id;

      await jobboard.chargeFee('addOpportunity');

      $('#confirm-modal').modal('hide');

      const res = await arweave.transactions.post(this.tx);
      if (res.status !== 200 && res.status !== 202) {
        console.log(res);
        return alert('Error while submiting the transaction.');
      }

      $('#job-title').val('')
      $('#job-amount').val('')
      this.quill.root.innerHTML = '';
      window.location.hash = '';
      
      const toast = new Toast(arweave);
      toast.showTransaction('Add opportunity', txid, {})
        .then(async () => {
          console.log('Tx completed');
        });

    });
  }

  private async removeEvents() {
    $('.submit-job, .confirm-tx').off('click');
  }
}