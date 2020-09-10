import Arweave from "arweave";

const arweave = Arweave.init({
  host: 'arweave.dev',
  protocol: 'https',
  port: 443,
  timeout: 100000
});

export default arweave;