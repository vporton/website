/**
 * This one is used on all parts of the admin panel.
 */

import $ from './libs/jquery';

$(document).ready(() => {
  if(window.localStorage.getItem('sidebar-icon-only')) {
    $('body').addClass('sidebar-icon-only');
  }

  $('button[data-toggle="minimize"]').on('click', e => {
    e.preventDefault();

    $('body').toggleClass('sidebar-icon-only');
    if(window.localStorage && window.localStorage.getItem('sidebar-icon-only')) {
      window.localStorage.removeItem('sidebar-icon-only');
    } else {
      window.localStorage.setItem('sidebar-icon-only', 'yes');
    }
  });
});