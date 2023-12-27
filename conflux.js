const { Conflux, Drip, address } = require('js-conflux-sdk');
const { Contract, JsonRpcProvider, Wallet } = require('ethers');
const { abi } = require('./artifacts/cfxs.json');
const exchangeContractMeta = require('./artifacts/CFXsTest2Main.json');
const cfxsMainMeta = require('./artifacts/CFXsMain.json');
const config = require('./config.json');

// core space sdk init
const conflux = new Conflux({
    url: 'https://main.confluxrpc.com',
    networkId: 1029,
});

const CrossSpaceCall = conflux.InternalContract('CrossSpaceCall');

// eSpace SDK init
const provider = new JsonRpcProvider( 'https://evm.confluxrpc.com');
const cfxsContract = new Contract(config.cfxs, abi, provider);

const cfxsExchangeContract = new Contract(config.exchangeContract, exchangeContractMeta.abi, provider);

const cfxsMainContract = new Contract(config.newCfxs, cfxsMainMeta.abi, provider);


async function transferCFXs(cfxsIds, receiver, account) {
    if (!cfxsIds || !receiver) {
        throw new Error('Invalid Inputs');
    }

    const data = cfxsMainContract.interface.encodeFunctionData('transfer(uint[],address)', [cfxsIds, receiver]);

    const receipt = await CrossSpaceCall.callEVM(config.newCfxs, data).sendTransaction({
        from: account.address,
        gasPrice: Drip.fromGDrip(config.coreGasPrice),
    }).executed();

    return receipt;
}

async function exchangeCFXs(cfxsIds = [], account) {
    if (!cfxsIds || cfxsIds.length === 0) return null;
    const data = cfxsExchangeContract.interface.encodeFunctionData('ExTestToMain', [cfxsIds]);
    const receipt = await CrossSpaceCall.callEVM(config.exchangeContract, data).sendTransaction({
        from: account.address,
        gasPrice: Drip.fromGDrip(config.coreGasPrice),
    }).executed();

    return receipt;
}

module.exports = {
    conflux,
    CrossSpaceCall,
    Drip,
    transferCFXs,
    cfxsContract,
    exchangeCFXs,
    cfxsExchangeContract,
    cfxsMainContract,
    provider,
}
