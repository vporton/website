import { expose } from "threads/worker";
import { BalancesInterface, VaultInterface } from "../daogarden-js/faces";

const worker = {
  usersAndBalance: (bal: BalancesInterface) => {
    const users = Object.keys(bal);
    const balance = users.map(u => bal[u]).reduce((a, b) => a + b, 0);

    return {users, balance};
  },
  vaultUsersAndBalance: (v: VaultInterface) => {
    const vaultUsers = Object.keys(v);
    let vaultBalance = 0;
    for(let i = 0, j = vaultUsers.length; i < j; i++) {
      vaultBalance += v[vaultUsers[i]].map(a => a.balance).reduce((a, b) => a + b, 0);
    }

    return {vaultUsers, vaultBalance};
  },
  getAddressBalance: (address: string, balances: BalancesInterface, vault: VaultInterface) => {
    let balance = balances[address];
    
    const userVault = vault[address];
    if(userVault) {
      for(let i = 0, j = userVault.length; i < j; i++) {
        balance += userVault[i].balance;
      }
    }

    return balance;
  }
}

export type BalancesWorker = typeof worker;
expose(worker);