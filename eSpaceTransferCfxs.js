const { cfxsMainContract, getWallet } = require('./conflux');
const {  Wallet, JsonRpcProvider } = require('ethers');
const { waitMilliseconds, getNewCfxsIds } = require('./utils.js');
const wallets = require('./espace-wallets');


// 'https://evm.confluxrpc.com'
// 'https://wallet.okex.org/priapi/v1/wallet/rpc/send?chainId=1030'
const provider = new JsonRpcProvider( 'https://evm.confluxrpc.com');

const receiver = '' // 收款账号

const STEP = 32;


const transfer = async (privateKey, index) => {
    const wallet = new Wallet(privateKey, provider);
    let cfxsMainContract1 = cfxsMainContract.connect(wallet);

    console.log(index, wallet.address, )

    async function goTransfer() {
        if (!receiver) {
            console.error('Usage: no receiver');
            return;
        }

        const ids = await getNewCfxsIds(wallet.address);

        for(let i = 0; i < ids.length; i += STEP) {
            try {
                // prepare ids
                let exIds = [];
                for(let j = 0; j < STEP; j++) {
                    if (i + j >= ids.length) break;

                    let id = ids[i+j];
                    if (id === '0') continue;
                    let cfxsId = parseInt(id);

                    // check owner
                    let info = await cfxsMainContract.CFXss(cfxsId);
                    if(!info || info.length === 0 || info[1] != wallet.address) {
                        await waitMilliseconds(100);
                        console.log(`Id ${cfxsId} is not yours`)
                        continue;
                    }

                    exIds.push(cfxsId);
                }

                if (exIds.length === 0) continue;

                //
                console.log(`Transfer cfxs id ${exIds} to ${receiver}`);
                const tx = await cfxsMainContract1.transfer(exIds, receiver);
                await tx.wait();
                // console.log(`Result: ${tx === 0 ? 'success' : 'fail'}`);
            } catch(e) {
                console.log('Transfer Error', e);
                await waitMilliseconds(500);
            }
        }
    }

    await goTransfer()
}


const main = async () => {
    for(let i =0; i < wallets.length-1; i++) {
        const item = wallets[i]
        try {
            await transfer(item, i)
        } catch(e) {
            console.log('Error', e)
        }
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
