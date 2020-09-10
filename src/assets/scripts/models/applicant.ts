import Utils from "../utils/utils";
import ApplicantInterface from "../interfaces/applicant";
import { GQLNodeInterface, GQLTransactionsResultInterface } from "../interfaces/gqlResult";
import Arweave from "arweave";
import jobboard from "../opportunity/jobboard";
import { get, getIdenticon } from "../utils/arweaveid";
import Toast from "../utils/toast";

export default class Applicant implements ApplicantInterface {
  id: string;
  username: string;
  address: string;
  avatar: string;
  message: string;
  oppId: string;

  constructor(params: ApplicantInterface) {
    if(Object.keys(params).length) {
      params = Utils.stripTags(params);
      for(let key in params) {
        this[key] = params[key];
      }
    }
  }

  async getMessage(arweave: Arweave): Promise<string> {
    if(!this.message) {
      const res = await arweave.api.get(`/${this.id}`);
      this.message = Utils.escapeScriptStyles(res.data);
    }

    return this.message;
  }

  static async getAll(oppIds: string[]): Promise<Applicant[]> {
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
          values: ${JSON.stringify(oppIds)}
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
      const toast = new Toast(jobboard.getArweave());
      toast.show('Error', 'Error connecting to the network.', 'error', 5000);
      return;
    }

    const res: Applicant[] = [];
    for(let i = 0, j = txs.edges.length; i < j; i++) {
      const applicant = await this.nodeToApplicant(txs.edges[i].node);
      res.push(applicant);
    }

    return res;
  }

  static async getAllByOppId(oppId: string): Promise<number|Applicant[]> {
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
      const toast = new Toast(jobboard.getArweave());
      toast.show('Error', 'Error connecting to the network.', 'error', 5000);
      return;
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
      
      const toast = new Toast(jobboard.getArweave());
      toast.show('Error', 'Error connecting to the network.', 'error', 5000);
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
    const user = await get(node.owner.address);
    const message = (await arweave.api.get(`/${node.id}`)).data;
    
    const applicant = new Applicant({
      id: node.id,
      address: node.owner.address,
      username: user.name || node.owner.address,
      avatar: user.avatarDataUri || getIdenticon(node.owner.address),
      message: Utils.stripHTML(message),
      oppId: objParams['Opportunity-ID']
    });

    return applicant;
  }
}