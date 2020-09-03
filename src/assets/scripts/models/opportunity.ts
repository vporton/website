import OpportunityInterface, { OpportunityCommunityInterface, OpportunityType, OpportunityExpLevel, OpportunityCommitment, OpportunityProjectType, OpportunityPermission, OpportunityStatus } from "../interfaces/opportunity";
import Utils from "../utils/utils";
import { GQLTransactionsResultInterface, GQLEdgeInterface, GQLNodeInterface } from "../interfaces/gqlResult";
import Arweave from "arweave";
import Transaction from "arweave/node/lib/transaction";
import { JWKInterface } from "arweave/node/lib/wallet";
import jobboard from "../opportunity/jobboard";
import Toast from "../utils/toast";

export default class Opportunity implements OpportunityInterface {
  id?: string;
  title: string;
  community: OpportunityCommunityInterface;
  description: string;
  payout: string;
  lockLength: number;
  type: OpportunityType;
  experience: OpportunityExpLevel;
  commitment: OpportunityCommitment;
  project: OpportunityProjectType;
  permission: OpportunityPermission;
  author: string;
  status: OpportunityStatus;
  updateTx: Transaction;
  timestamp: number;
  
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
      const toast = new Toast(jobboard.getArweave());
      toast.show('Error', 'Error connecting to the network.', 'error', 5000);
      return;
    }

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
    $('.btn-opp-status').addClass('btn-loading');

    const keys = Object.keys(params);
    if(!keys.length) {
      return false;
    }

    const arweave = jobboard.getArweave();
    const wallet =  await jobboard.getAccount().getWallet();

    const toast = new Toast(arweave);
    if(this.author !== await jobboard.getAccount().getAddress()) {
      toast.show('Error', 'You cannot edit this opportunity.', 'error', 5000);
      return false;
    }

    if(!await jobboard.chargeFee('updateOpportunity')) {
      $('.btn-opp-status').removeClass('btn-loading');
      return false;
    }

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

      toast.show('Error', 'Error submitting transaction.', 'error', 5000);
      $('.btn-opp-status').removeClass('btn-loading');
      return false;
    }

    jobboard.getStatusify().add('Update opportunity', tx.id);
    $('.btn-opp-status').removeClass('btn-loading');
  }

  static async getAll(): Promise<Opportunity[]> {
    let hasNextPage = true;
    let edges: GQLEdgeInterface[] = [];
    let cursor: string = '';

    while(hasNextPage) {
      const query = {
        query: `
        query{
          transactions(
            tags:[{
              name: "App-Name",
              values: "CommunityXYZ"
            },
            {
              name: "Action",
              values: "addOpportunity"
            }]
            after: "${cursor}"
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
  
      let res: any;
      try {
        res = await jobboard.getArweave().api.request().post('https://arweave.dev/graphql', query);
      } catch (err) {
        console.log(err);
        
        const toast = new Toast(jobboard.getArweave());
        toast.show('Error', 'Error connecting to the network.', 'error', 5000);
        return;
      }
  
      const transactions: GQLTransactionsResultInterface = res.data.data.transactions;
      if(transactions.edges) {
        edges = edges.concat(transactions.edges);
        cursor = transactions.edges[transactions.edges.length - 1].cursor;
      }

      hasNextPage = transactions.pageInfo.hasNextPage;
    }

    const opps: Opportunity[] = [];
    for(let i = 0, j = edges.length; i < j; i++) {
      const opp = await Opportunity.nodeToOpportunity(edges[i].node);
      await opp.update();
      if(opp.status !== 'Active' && opp.status !== 'In progress') {
        continue;
      }
      opps.push(opp);
    }

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
      
      const toast = new Toast(jobboard.getArweave());
      toast.show('Error', 'Error connecting to the network.', 'error', 5000);
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
      lockLength: +objParams.lockLength || 0,
      type: objParams.jobType,
      experience: objParams.expLevel,
      commitment: objParams.commitment,
      project: objParams.project,
      permission: objParams.permission,
      author: node.owner.address,
      timestamp: (node.block && node.block.timestamp? node.block.timestamp * 1000 : (new Date()).getTime())
    });

    await opp.update();
    return opp;
  }

}