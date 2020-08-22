import OpportunityInterface, { OpportunityCommunityInterface, OpportunityType, OpportunityExpLevel, OpportunityCommitment, OpportunityProjectType, OpportunityPermission, OpportunityStatus } from "../interfaces/opportunity";
import Utils from "../utils/utils";
import { GQLTransactionsResultInterface, GQLEdgeInterface, GQLNodeInterface } from "../interfaces/gqlResult";
import Arweave from "arweave";
import Transaction from "arweave/node/lib/transaction";
import { JWKInterface } from "arweave/node/lib/wallet";
import jobboard from "../opportunities/jobboard";
import Toast from "../utils/toast";

export default class Opportunity implements OpportunityInterface {
  id?: string;
  title: string;
  community: OpportunityCommunityInterface;
  description: string;
  payout: string;
  type: OpportunityType;
  experience: OpportunityExpLevel;
  commitment: OpportunityCommitment;
  project: OpportunityProjectType;
  permission: OpportunityPermission;
  author: string;
  status: OpportunityStatus;
  updateTx: Transaction;

  
  constructor(params: OpportunityInterface) {
    if(Object.keys(params).length) {
      params = Utils.stripTags(params);
      for(let key in params) {
        this[key] = params[key];
      }
    }

    this.status = 'Active';
  }

  async update(params?: {[key: string]: string}) {
    if(params) {
      return this.doUpdate(params);
    }

    const query = {
      query: `
      query{
        transactions(
          first: 1
          owners: "${this.author}"
          tags:[
          {
            name: "App-Name",
            values: "CommunityXYZ"
          },
          {
            name: "Action",
            values: "updateOpportunity"
          },
          {
            name: "Opportunity-ID",
            values: "${this.id}"
          }]
        ){
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              owner {
                address
              },
              tags {
                name,
                value
              }
              block {
                timestamp
                height
              }
            }
          }
        }
      }
      `
    };

    let txs: GQLTransactionsResultInterface;
    try {
      const res = await jobboard.getArweave().api.request().post('https://arweave.dev/graphql', query);
      txs = res.data.data.transactions;
    } catch (err) {
      console.log(query);
      console.log(err);
    }

    console.log(txs);
    if(!txs.edges.length) {
      return;
    }

    for(let i = 0; i < txs.edges[0].node.tags.length; i++) {
      if(txs.edges[0].node.tags[i].name === 'status') {
        // @ts-ignore
        this.status = txs.edges[0].node.tags[i].value;
      }
    }
  }

  private async doUpdate(params: {[key: string]: string}) {
    const keys = Object.keys(params);
    if(!keys.length) {
      return;
    }

    const arweave = jobboard.getArweave();
    const wallet =  await jobboard.getAccount().getWallet();

    if(!await jobboard.chargeFee('updateOpportunity')) {
      return;
    }

    $('.btn-opp-status').addClass('btn-loading');
    const tx = await arweave.createTransaction({ data: Math.random().toString().substr(-4) }, wallet);
    
    for(let i = 0; i < keys.length; i++) {
      const key = keys[i];
      tx.addTag(key, params[key]);
    }
    
    tx.addTag('App-Name', 'CommunityXYZ');
    tx.addTag('Action', 'updateOpportunity');
    tx.addTag('Opportunity-ID', this.id);

    await arweave.transactions.sign(tx, wallet);
    const res = await arweave.transactions.post(tx);
    if (res.status !== 200 && res.status !== 202) {
      console.log(res);
      alert('Error submitting transaction.');
      return false;
    }

    const toast = new Toast(arweave);
    toast.showTransaction('Update opportunity', tx.id, params).then(() => {
      window.location.reload();
    });
  }

  static async getAll(): Promise<Opportunity[]> {
    const query = {
      query: `
      query{
        transactions(tags:[{
          name: "App-Name",
          values: "CommunityXYZ"
        },
        {
          name: "Action",
          values: "addOpportunity"
        }]){
          pageInfo {
            hasNextPage
          }
          edges {
            cursor
            node {
              id
              owner {
                address
              },
              tags {
                name,
                value
              }
              block {
                timestamp
                height
              }
            }
          }
        }
      }
      `
    };

    let txs: GQLTransactionsResultInterface;
    try {
      const res = await jobboard.getArweave().api.request().post('https://arweave.dev/graphql', query);
      txs = res.data.data.transactions;
    } catch (err) {
      console.log(err);
      alert('Error connecting to the network.');
      return;
    }

    const opps: Opportunity[] = [];
    for(let i = 0, j = txs.edges.length; i < j; i++) {
      const opp = await Opportunity.nodeToOpportunity(txs.edges[i].node);
      await opp.update();
      if(opp.status !== 'Active' && opp.status !== 'In progress') {
        continue;
      }
      opps.push(opp);
    }

    console.log(opps);
    return opps;
  }

  static async getOpportunity(opportunityId: string, arweave: Arweave): Promise<Opportunity> {
    const query = {
      query: `
      query{
        transaction(
          id: "${opportunityId}"
        ){
          id
          owner {
            address
          },
          tags {
            name,
            value
          }
          block {
            timestamp
            height
          }
        }
      }
      `
    };

    let tx: GQLNodeInterface;
    try {
      const res = await arweave.api.request().post('https://arweave.dev/graphql', query);
      tx = res.data.data.transaction;
    } catch (err) {
      console.log(err);
      alert('Error connecting to the network.');
      return;
    }

    if(!tx) {
      return;
    }

    return this.nodeToOpportunity(tx);
  }

  static async nodeToOpportunity(node: GQLNodeInterface): Promise<Opportunity> {
    // Default object
    const objParams: any = {};
    for(let i = 0, j = node.tags.length; i < j; i++) {
      objParams[Utils.stripTags(node.tags[i].name)] = Utils.stripTags(node.tags[i].value);
    }
    
    const opp = new Opportunity({
      id: node.id,
      title: objParams.title,
      community: {
        id: objParams.communityId,
        name: objParams.communityName,
        ticker: objParams.communityTicker
      },
      description: '',
      payout: objParams.payout,
      type: objParams.jobType,
      experience: objParams.expLevel,
      commitment: objParams.commitment,
      project: objParams.project,
      permission: objParams.permission,
      author: node.owner.address
    });

    await opp.update();
    return opp;
  }

}