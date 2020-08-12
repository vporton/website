import "../styles/style.scss";
import "bootstrap/dist/js/bootstrap.bundle";

import $ from './libs/jquery';
import './global';

$(document).ready(() => {
  $('a.create').attr('href', './create.html');
});