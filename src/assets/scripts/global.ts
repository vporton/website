/**
 * This one is used on all parts of the admin panel.
 */

import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';

Sentry.init({
  dsn: 'https://797cc582ba794c93934d01bf44722e96@o440904.ingest.sentry.io/5410617',
  integrations: [
    new Integrations.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});

import * as feather from "feather-icons";
import $ from './libs/jquery';
import './libs/arweave';

$(() => {
  feather.replace({width: 16, height: 16});
  $('[data-toggle="popover"]').popover();
  $('[data-toggle="tooltip"]').tooltip();
  $('.toast').toast();
});