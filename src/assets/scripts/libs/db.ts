import engine from 'store/src/store-engine';
import localStorage from 'store/storages/localStorage';
import memoryStorage from 'store/storages/memoryStorage';
import cookieStorage from 'store/storages/cookieStorage';
import expirePlugin from 'store/plugins/expire';

const communityDB = engine.createStore([localStorage, memoryStorage], [expirePlugin]);
export default communityDB;

class CookieStore {
  set(name: string, value :string, days: number = 5) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

get(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

  remove(name: string) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}

export const cookieStore = new CookieStore();