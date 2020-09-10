import AuthorInterface from "../interfaces/author";
import { get, getIdenticon } from "../utils/arweaveid";
import communityDB from "../libs/db";

export default class Author {
  private _name: string;
  private _address: string;
  private _avatar: string;

  get address(): string {
    return this._address;
  }

  constructor(name: string, address: string, avatar: string) {
    this._name = name;
    this._address = address;
    this._avatar = avatar;
  }

  async getDetails(): Promise<AuthorInterface> {
    // caching but for only 30 mins
    if(!this._avatar) {
      const res = communityDB.get(this._address);
      let author: any;

      if(res) {
        author = res;
      } else {
        author = await get(this._address);
        // @ts-ignore
        communityDB.set(this._address, author, (new Date().getTime() + 30 * 60 * 1000));
      }
      
      this._name = author.name || this._address;
      this._avatar = author.avatarDataUri || getIdenticon(this._address);
    }

    return {
      name: this._name,
      address: this._address,
      avatar: this._avatar
    };
  }
}