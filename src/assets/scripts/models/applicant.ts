import Utils from "../utils/utils";
import ApplicantInterface from "../interfaces/applicant";
import { GQLNodeInterface, GQLTransactionsResultInterface } from "../interfaces/gqlResult";
import Arweave from "arweave";
import { get, getIdenticon } from "arweave-id";
import jobboard from "../opportunity/jobboard";

export default class Applicant implements ApplicantInterface {
  id: string;
  username: string;
  address: string;
  avatar: string;
  message: string;

  constructor(params: ApplicantInterface) {
    if(Object.keys(params).length) {
      params = Utils.stripTags(params);
      for(let key in params) {
        this[key] = params[key];
      }
    }
  }

  static async getAll(oppId: string, onlyCount = false): Promise<number|Applicant[]> {
    const query = {
      query: `
      query{
        transactions(tags:[{
          name: "App-Name",
          values: "CommunityXYZ"
        },
        {
          name: "Action",
          values: "Application"
        },
        {
          name: "Opportunity-ID",
          values: "${oppId}"
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

    if(onlyCount) {
      return txs.edges.length;
    }

    const applicants: Applicant[] = [];
    for(let i = 0, j = txs.edges.length; i < j; i++) {
      const applicant = await this.nodeToApplicant(txs.edges[i].node);
      applicants.push(applicant);
    }

    return applicants;
  }

  static async getApplicant(opportunityId: string, arweave: Arweave): Promise<Applicant> {
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

    return this.nodeToApplicant(tx);
  }

  static async nodeToApplicant(node: GQLNodeInterface): Promise<Applicant> {
    // Default object
    const objParams: any = {};
    for(let i = 0, j = node.tags.length; i < j; i++) {
      objParams[Utils.stripTags(node.tags[i].name)] = Utils.stripTags(node.tags[i].value);
    }

    const arweave = jobboard.getArweave();
    const user = await get(node.owner.address, arweave);
    const message = (await arweave.api.get(`/${node.id}`)).data;
    
    const applicant = new Applicant({
      id: node.id,
      address: node.owner.address,
      username: user.name || node.owner.address,
      avatar: user.avatarDataUri || getIdenticon(node.owner.address),
      message: Utils.stripHTML(message)
    });

    return applicant;
  }
}