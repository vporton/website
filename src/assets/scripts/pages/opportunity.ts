import { spawn, ModuleThread } from "threads";

import $ from '../libs/jquery';
import { BalancesWorker } from "../workers/balances";
import app from "../app";

export default class PageOpportunity {
  constructor() {}

  async open() {
    $('.page-opportunity').show();
    $('.link-opportunity').addClass('active');
    this.syncPageState();
  }

  async close() {
    $('.link-opportunity').removeClass('active');
    $('.page-opportunity').hide();
  }

  public async syncPageState() {
    // const opps = await app.getOpportunities().getAllByCommunityIds([app.getCommunityId()]);
    // console.log(opps, app.getCommunityId());
  }

}