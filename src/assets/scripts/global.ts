/**
 * This one is used on all parts of the admin panel.
 */

import * as feather from "feather-icons";
import $ from './libs/jquery';

$(document).ready(() => {
  feather.replace({width: 16, height: 16});
  $('[data-toggle="popover"]').popover();
  $('.toast').toast();
});