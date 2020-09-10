import Utils from "../utils/utils";
import ApplicantInterface from "../interfaces/applicant";
import { GQLNodeInterface, GQLTransactionsResultInterface } from "../interfaces/gqlResult";
import Toast from "../utils/toast";
import arweave from "../libs/arweave";
import Author from "./author";

export default class Applicant implements ApplicantInterface {
  id: string;
  author: Author;
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

  async getMessage(): Promise<string> {
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
      const res = await arweave.api.post('/graphql', query);
      txs = res.data.data.transactions;
    } catch (err) {
      console.log(err);
      const toast = new Toast();
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

  static async nodeToApplicant(node: GQLNodeInterface): Promise<Applicant> {
    // Default object
    const objParams: any = {};
    for(let i = 0, j = node.tags.length; i < j; i++) {
      objParams[Utils.stripTags(node.tags[i].name)] = Utils.stripTags(node.tags[i].value);
    }

    const applicant = new Applicant({
      id: node.id,
      author: new Author(node.owner.address, node.owner.address, null),
      message: null,
      oppId: objParams['Opportunity-ID']
    });
    return applicant;
  }
}