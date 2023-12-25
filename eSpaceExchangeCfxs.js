const { cfxsExchangeContract, cfxsContract } = require('./conflux');
const {  Wallet, JsonRpcProvider } = require('ethers');
const { waitMilliseconds, getIDs } = require('./utils.js');
const wallets = require('./espace-wallets');


// 'https://evm.confluxrpc.com'
// 'https://wallet.okex.org/priapi/v1/wallet/rpc/send?chainId=1030'
const provider = new JsonRpcProvider( 'https://evm.confluxrpc.com');
const STEP = 5;

const exchange = async (privateKey, index) => {
    const wallet = new Wallet(privateKey, provider);
    const cfxsExchangeContract1 = cfxsExchangeContract.connect(wallet);

    console.log(index, wallet.address, )

    async function goExchange() {
        const ids = await getIDs(wallet.address);

        for(let i = 0; i < ids.length; i += STEP) {
            try {
                // prepare batch ids
                let exIds = [];
                for(let j = 0; j < STEP; j++) {
                    if (i + j >= ids.length) break;

                    let id = ids[i+j];
                    if (id === '0') continue;
                    let cfxsId = parseInt(id);

                    // check owner
                    let info = await cfxsContract.CFXss(cfxsId);
                    if(!info || info.length === 0 || info[1] != wallet.address) {
                        await waitMilliseconds(100);
                        console.log(`Id ${cfxsId} is not yours`)
                        continue;
                    }

                    exIds.push(cfxsId);
                }
                if (exIds.length === 0) continue;

                // exchange
                console.log(`Exchange cfxs id ${exIds}`);
                const tx = await cfxsExchangeContract1.ExTestToMain(exIds);
                await tx.wait();
                // console.log(`Result: ${tx === 0 ? 'success' : 'fail'}`);
            } catch(e) {
                console.log('Exchange Error', e);
                await waitMilliseconds(500);
            }
        }
    }

    await goExchange()
}

const main = async () => {
    for(let i =0; i < wallets.length-1; i++) {
        const item = wallets[i]
        await exchange(item, i)
    }
}

main()


process
  .on('unhandledRejection', (reason, p) => {
      console.error(reason, 'Unhandled Rejection at Promise', p)
  })
  .on('uncaughtException', err => {
      console.error(err, 'Uncaught Exception thrown')
  })

