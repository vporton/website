import 'css.gg/icons/css/loadbar-alt.css';
import "../styles/style.scss";

import Arweave from 'arweave/web';
import $ from './libs/jquery';
import "bootstrap/dist/js/bootstrap.bundle";

import './global';
import { JWKInterface } from "arweave/web/lib/wallet";

const arweave = Arweave.init({});

let currentStep = 1;
let wallet: JWKInterface;
const create = {
  address: '',
  balance: 0,
  daoName: '',
  ticker: '',
  balances: {},
  support: 0,
  quorum: 0,
  voteLength: 0,
  lockMinLength: 0,
  lockMaxLength: 0
}

const allowContinue = () => {
  $('.continue').text(currentStep === 4? 'Launch DAO' : 'Continue');
  $('.continue').removeClass('btn-outline-primary').addClass('btn-primary');
}

const validate = (e: any, fromContinue = false) => {
  if(currentStep === 1 && !fromContinue) {
    $('.file-upload-info').val($(e.target).val().replace(/C:\\fakepath\\/i, ''));

    $('.file-upload-browse').html('<i class="gg-loadbar-alt"></i>');

    const fileReader = new FileReader();
    fileReader.onload = async (ev: any) => {
      wallet = JSON.parse(ev.target.result);
      create.address = await arweave.wallets.jwkToAddress(wallet);
      create.balance = +arweave.ar.winstonToAr((await arweave.wallets.getBalance(create.address)), { formatted: true, decimals: 5, trim: true });

      $('.addy').text(create.address);
      $('.bal').text(create.balance);

      $('.file-upload-browse').html('Wallet');
      allowContinue();
    };
    fileReader.readAsText(e.target.files[0]);

  } else if(currentStep === 2) {
    create.daoName = $('#daoname').val().trim();
    create.ticker = $('#psttoken').val().trim().toUpperCase();

    const $holders = $('.holder');
    const $holdersBalance = $('.holder-balance');
    
    for(let i = 0, j = $holders.length; i < j; i++) {
      const $holder = $($holders[i]);
      const holder = $holder.val().trim();
      const bal = +$($holdersBalance[i]).val().trim();

      
      if(!/^[a-z0-9-_]{43}$/i.test(holder)) {
        $holder.addClass('border-danger');
        continue;
      } else {
        $holder.removeClass('border-danger');
      }

      if(holder.length && bal && !isNaN(bal) && Number.isInteger(bal)) {
        create.balances[holder] = bal;
      }
    }

    if(create.daoName.length && create.ticker.length && Object.keys(create.balances).length) {
      $('.daoname').text(create.daoName);
      $('.ticker').text(create.ticker);

      // TODO: add each holders and their balances
      let html = '';

      let i = 0;
      for(let acc in create.balances) {
        html += `<small class="form-text text-muted mt-3">Token Holder #${++i}</small>`;
        html += `<div class="row"><div class="col-md-8">${acc}</div><div class="col-md-4">${create.balances[acc]} ${create.ticker}</div></div>`;
      }
      $('.show-holders').html(html);

      allowContinue();
    }
  } else if(currentStep === 3) {
    const support = +$('#support').val().trim();
    const quorum = +$('#quorum').val().trim();
    const voteLength = +$('#voteLength').val().trim();
    const lockMinLength = +$('#lockMinLength').val().trim();
    const lockMaxLength = +$('#lockMaxLength').val().trim();

    if(!isNaN(support) && Number.isInteger(support) && support < 100) {
      create.support = support;
    }
    if(!isNaN(quorum) && Number.isInteger(quorum) && quorum < 100) {
      create.quorum = quorum;
    }
    if(!isNaN(voteLength) && Number.isInteger(voteLength)) {
      create.voteLength = voteLength;
    }
    if(!isNaN(lockMinLength) && Number.isInteger(lockMinLength)) {
      create.lockMinLength = lockMinLength;
    }
    if(!isNaN(lockMaxLength) && Number.isInteger(lockMaxLength)) {
      create.lockMaxLength = lockMaxLength;
    }

    if(create.support && create.quorum && create.voteLength && create.lockMinLength && create.lockMaxLength) {
      $('.support').text(create.support);
      $('.quorum').text(create.quorum);
      $('.voteLength').text(create.voteLength);
      $('.lockMinLength').text(create.lockMinLength);
      $('.lockMaxLength').text(create.lockMaxLength);

      allowContinue();
    }
  } else if(currentStep === 4) {
    allowContinue();
  }
};

$(document).ready(() => {
  $('[data-toggle="tooltip"]').tooltip();

  $('.back').on('click', (e: any) => {
    e.preventDefault();

    if($(e.target).is('.btn-light') && currentStep > 1) {
      $(`.step${currentStep}`).fadeOut(() => {
        $(`.step${--currentStep}`).fadeIn();

        $('.continue').text(currentStep === 4? 'Launch DAO' : 'Continue');
        $('.continue').removeClass('btn-outline-primary').addClass('btn-primary');
        if(currentStep === 1) {
          $(e.target).removeClass('btn-light').addClass('btn-outline-light');
        } else {
          $(e.target).removeClass('btn-outline-light').addClass('btn-light');
        }
      });
    }
  });

  $('.continue').on('click', (e: any) => {
    e.preventDefault();

    if($(e.target).is('.btn-primary') && currentStep < 4) {
      $(`.step${currentStep}`).fadeOut(() => {
        $(`.step${++currentStep}`).fadeIn();

        $(e.target).removeClass('btn-primary').addClass('btn-outline-primary');
        $('.back').removeClass('btn-outline-light').addClass('btn-light');

        validate(e, true);
      });
    }
  });

  $('.file-upload-browse').on('click', (e: any) => {
    e.preventDefault();

    var file = $('.file-upload-default');
    file.trigger('click');
  });
  
  $(document).on('change', 'input', (e: any) => {
    validate(e);
  }).on('keyup', (e: any) => {
    validate(e);
  });

  $('.add-holders').on('click', (e: any) => {
    e.preventDefault();

    $('.holders').append(`<div class="col-sm-8 mb-3"><input class="holder form-control form-control-sm" type="text"></div><div class="col-sm-4 mb-3"><div class="input-group input-group-sm"><input class="holder-balance form-control input-number" type="text" value="0"><div class="input-group-append"><div class="input-group-text bg-gradient-primary text-white ticker">${create.ticker}</div></div></div></div>`);
  
  });
  $(document).on('input', '.input-number', (e: any) => {
    const $target = $(e.target);
    const newVal = +$target.val().replace(/[^0-9]/g, '');
    $target.val(newVal);

    if($target.hasClass('percent') && newVal > 99) {
      $target.val(99);
    }
  });

  $('.collapse').on('click', 'a', (e: any) => {
    e.preventDefault();

    $(e.target).parent().parent().find('.btn').removeClass('btn-primary').addClass('btn-outline-primary');
    $(e.target).removeClass('btn-outline-primary').addClass('btn-primary');

    $('.collapse-content:visible').slideUp(() => {
      $($(e.target).attr('href')).slideDown();
    });
  });
});