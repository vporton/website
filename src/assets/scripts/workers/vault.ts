import { expose } from "threads/worker";
import { VaultInterface } from "../daogarden-js/faces";

const worker = {
  meVsOthersBalances: (v: VaultInterface, address: string) => {
    const vaultUsers = Object.keys(v);
    let me = 0;
    let others = 0;
    for(let i = 0, j = vaultUsers.length; i < j; i++) {
      if(vaultUsers[i] === address) {
        me += v[vaultUsers[i]].map(a => a.balance).reduce((a, b) => a + b, 0);
      } else {
        others += v[vaultUsers[i]].map(a => a.balance).reduce((a, b) => a + b, 0);
      }
    }

    return {me, others};
  }, 
  meVsOthersWeight: (v: VaultInterface, address: string) => {
    const vaultUsers = Object.keys(v);
    let me = 0;
    let others = 0;
    for(let i = 0, j = vaultUsers.length; i < j; i++) {
      if(vaultUsers[i] === address) {
        me += v[vaultUsers[i]].map(a => a.balance * (a.end - a.start)).reduce((a, b) => a + b, 0);
      } else {
        others += v[vaultUsers[i]].map(a => a.balance * (a.end - a.start)).reduce((a, b) => a + b, 0);
      }
    }

    return {me, others};
  }
}

export type VaultWorker = typeof worker;
expose(worker);