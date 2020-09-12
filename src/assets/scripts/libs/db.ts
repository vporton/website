import store from 'store';
import expirePlugin from 'store/plugins/expire';

store.addPlugin(expirePlugin);

const communityDB = store;
export default communityDB;