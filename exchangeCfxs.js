const { exchangeCFXs, cfxsContract, cfxsExchangeContract } = require('./conflux');
const { Conflux, address } = require('js-conflux-sdk');
const { waitMilliseconds, getIDs } = require('./utils.js');
const coreWallets = require('./core-wallets');


const conflux = new Conflux({
    url: 'https://main.confluxrpc.com',
    networkId: 1029,
});

const STEP = 5;

const exchangeCoreS = async (privateKey, index) => {

    const account = conflux.wallet.addPrivateKey(privateKey);

    const mappedAddress = address.cfxMappedEVMSpaceAddress(account.address);

    console.log(index, account.address)
    console.log('espace', mappedAddress)


    async function exchange() {
        const ids = await getIDs(mappedAddress);

        for(let i = 0; i < ids.length; i += STEP) {
            try {
                let exIds = [];
                for(let j = 0; j < STEP; j++) {
                    if (i + j >= ids.length) break;

                    let id = ids[i + j];
                    if (id === '0') continue;
                    let cfxsId = parseInt(id);

                    let minted = await cfxsExchangeContract.minted(cfxsId);
                    if (minted) {
                        console.log(`Id ${cfxsId} already exchanged`);
                        await waitMilliseconds(100);
                        continue;
                    }

                    // check owner
                    let info = await cfxsContract.CFXss(cfxsId);
                    if(!info || info.length === 0 || info[1] != mappedAddress) {
                        console.log(`Id ${cfxsId} is not yours`);
                        await waitMilliseconds(100);
                        continue;
                    }

                    exIds.push(cfxsId);
                }

                if (exIds.length === 0) continue;

                console.log(`Exchange cfxs id ${exIds}`);
                const receipt = await exchangeCFXs(exIds);
                console.log(`Result: ${receipt.outcomeStatus === 0 ? 'success' : 'fail'}`);
                console.log('Tx hash', receipt.transactionHash);
            } catch(e) {
                console.log('Transfer Error', e);
                await waitMilliseconds(500);
            }
        }

        console.log('Finished');
    }

    await exchange()
}

const main = async () => {
    for(let i =0; i < coreWallets.length-1; i++) {
        const item = coreWallets[i]
        try {
            await exchangeCoreS(item, i)
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
