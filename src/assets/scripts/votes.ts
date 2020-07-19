import "@mdi/font/scss/materialdesignicons.scss"
import "../styles/style.scss";

import $ from './libs/jquery';
import "bootstrap/dist/js/bootstrap.bundle";

import './global';

$(document).ready(() => {
  run().then(() => {
    const max = Math.max(...$('.card').map((i, e) => {
      return $(e).height();
    }));
  
    $('.card').height(max);
    $('.spinner').fadeOut(() => {
      $('.votes').removeClass('hidden');
    });
  });

  $(window).on('resize', () => {
    $('.card').removeAttr('style');
    if($(window).width() <= 667) {
      return;
    }

    const max = Math.max(...$('.card').map((i, e) => {
      return $(e).height();
    }));
    $('.card').height(max);
  });
});

const run = async () => {
  let html = '';

  for(let i = 0; i < 20; i++) {
    const isVoted = i > 10;
    const rand = Math.random();
    const mint = Math.floor((Math.random() * 10) + 1);

    html += `<div class="col-md-6 mb-5">
      <div class="card card-body">
        <div class="card-category">
          <div class="btn btn-rounded btn-gradient-${rand > 0.5? 'primary' : 'info'}"><i class="mdi mdi-contacts"></i> ${rand > 0.5? 'Tokens' : 'Vote'}</div>
        </div>`;

    if(rand > 0.5) {
      html += `<div class="card-title">Mint: ${mint} TOK</div>
      <div class="card-description">For: KhoPVdVWv1gGelkIp_lXIoHSdx4ZDuUHfA</div>`;
    } else {
      html += `<div class="card-title">This is a question</div>
      <div class="card-description">Vote description: This one has a huge description, just to see what happens next... I'm hopping it has at least 3 lines...</div>`;
    }

    html += `<table class="table mb-5">
      <tbody>
        <tr><td>Yes</td><td><div class="progress"><div class="progress-bar bg-success" style="width: 25%" aria-value-now="25" aria-valuemin="0" aria-valuemax="100"></div></div></td></tr>
        <tr><td>No</td><td><div class="progress"><div class="progress-bar bg-danger" style="width: 10%" aria-value-now="10" aria-valuemin="0" aria-valuemax="100"></div></div></td></tr>
        </tbody>
    </table>`;

    if(isVoted) {
      html += `<div class="vote-text text-center">
        <a href="#" class="btn btn-light">Already Voted</a>
      </div>`;
    } else {
      html += `<div class="vote-text text-center">
        <a href="#" class="btn btn-gradient-success">Vote</a>
      </div>`;
    }
        
    html += `</div>
    </div>`;
  }

  $('.votes').html(html);

  return true;
};