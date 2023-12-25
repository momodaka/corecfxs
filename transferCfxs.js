const { transferCFXs, cfxsMainContract } = require('./conflux');
const { address, Conflux } = require('js-conflux-sdk');
const { waitMilliseconds, getIDs } = require('./utils.js');
const coreWallets = require("./core-wallets");

const STEP = 32;

const conflux = new Conflux({
    url: 'https://main.confluxrpc.com',
    networkId: 1029,
});

const receiver = '' // 收款账号

const transferCore = async (privateKey, index) => {

    const account = conflux.wallet.addPrivateKey(privateKey);

    const mappedAddress = address.cfxMappedEVMSpaceAddress(account.address);

    console.log(index, account.address)
    console.log('espace', mappedAddress)

    async function main() {
        if (!receiver) {
            console.error('Usage: no receiver');
            return;
        }

        const ids = await getIDs(mappedAddress);

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
                    let info = await cfxsMainContract.CFXss(cfxsId);
                    if(!info || info.length === 0 || info[1] != mappedAddress) {
                        await waitMilliseconds(100);
                        console.log(`Id ${cfxsId} is not yours`)
                        continue;
                    }

                    exIds.push(cfxsId);
                }

                if (exIds.length === 0) continue;

                console.log(`Transfer cfxs id ${exIds} to ${receiver}`);
                const receipt = await transferCFXs(exIds, receiver);
                console.log(`Result: ${receipt.outcomeStatus === 0 ? 'success' : 'fail'}`);
            } catch(e) {
                console.log('Transfer Error', e);
                await waitMilliseconds(500);
            }
        }

        console.log('Done');
    }

    await main()
}

const main = async () => {
    for(let i =0; i < coreWallets.length-1; i++) {
        const item = coreWallets[i]
        await transferCore(item, i)
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
