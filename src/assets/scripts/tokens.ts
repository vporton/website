import "@mdi/font/scss/materialdesignicons.scss"
import "gridjs/dist/theme/mermaid.css";
import "../styles/style.scss";

import $ from './libs/jquery';
import "bootstrap/dist/js/bootstrap.bundle";
import { Grid, html } from 'gridjs';

import './global';

import Arweave from 'arweave/web';
import * as arweaveID from 'arweave-id';

const arweave = Arweave.init({});

function makeid(length) {
  let result           = '';
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

$(document).ready(async () => {
  const grid = new Grid({
    columns: [{
      name: '',
      formatter: (cell) => html(`<img src="${cell}" width="24">`),
      width: '1px'
    }, {
      name: 'Holder Address',
      formatter: (cell) => html(`<span data-addy="${cell[1]}">${cell[0]||cell[1]}</span>`)
    }, 'Balance'],
    data: async () => {
      const data = [];
      for(let i = 0; i < 20; i++) {
        let addy = makeid(34);
        if(i === 0) {
          addy = 'BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU';
        }
        const user = await arweaveID.get(addy, arweave);
        if(!user.avatarDataUri) user.avatarDataUri = arweaveID.getIdenticon(user.name || addy);
    
        data.push([user.avatarDataUri, [user.name, addy], (Math.floor(Math.random() * 5) + 1)]);
      }

      return data;
    },
    //search: true,
    pagination: {
      enabled: true,
      limit: 10,
      summary: false,
      prevButton: false,
      nextButton: false
    },
    fixedHeader: true
  });

  grid.on('rowClick', (...args) => {
    console.log(`row: ${JSON.stringify(args)}`, args);
  });

  grid.render(document.getElementById('tokens-table'));

  $('.table').find('tbody').html(html);
  $('.spinner').fadeOut(() => {
    $('.card').fadeIn();
  });
});