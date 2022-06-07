/*
  .-')   .-') _     ('-.       .-') _  .-')            .-') _               (`-.     ('-.   
 ( OO ).(  OO) )  _(  OO)     ( OO ) )( OO ).         (  OO) )            _(OO  )_ _(  OO)  
(_)---\_)     '._(,------.,--./ ,--,'(_)---\_) ,-.-') /     '._ ,-.-'),--(_/   ,. (,------. 
/    _ ||'--...__)|  .---'|   \ |  |\/    _ |  |  |OO)|'--...__)|  |OO)   \   /(__/|  .---' 
\  :` `.'--.  .--'|  |    |    \|  | )  :` `.  |  |  \'--.  .--'|  |  \\   \ /   / |  |     
 '..`''.)  |  |  (|  '--. |  .     |/ '..`''.) |  |(_/   |  |   |  |(_/ \   '   /,(|  '--.  
.-._)   \  |  |   |  .--' |  |\    | .-._)   \,|  |_.'   |  |  ,|  |_.'  \     /__)|  .--'  
\       /  |  |   |  `---.|  | \   | \       (_|  |      |  | (_|  |      \   /    |  `---. 
 `-----'   `--'   `------'`--'  `--'  `-----'  `--'      `--'   `--'       `-'     `------' 
 
Version: 1.1
Hold tight, version with errors handling and with a better workflow coming soon!
Author: Tommaso De Ponti -- Xycloo | https://tdep.xycloo.com/
*/

const crypto = require('crypto-browserify')
const Buffer = require('buffer').Buffer;
const Stream = require('stream-browserify');


// Horizon base url |> default is "horizon-testnet.stellar.org"
let HORIZON_BASE = "horizon-testnet.stellar.org"


// Utility stellar retrieve fs
const readStellarAccountDataAttributes = async (accountID) => {
    let response = await fetch(`https://${HORIZON_BASE}/accounts/${accountID}`)
    let data = await response.json()
    const decodedData = Object.keys(data.data).reduce((acc, key) => { acc[key] = atob(data.data[key]); return acc; }, {})
    return decodedData;
}
const readStellarAccountSequenceNumber = async (accountID) => {
    let response = await fetch(`https://${HORIZON_BASE}/accounts/${accountID}`)
    let data = await response.json()
    return data.sequence;
}


// IPFS upload & download utils
const uploadToIPFS = async (dataName, data) => {
    var raw = JSON.stringify({
        dataName: dataName,
        data: data
    });
    var requestOptions = {
        method: 'POST',
        body: raw,
        redirect: 'follow'
    };
    let response = await fetch("https://ipfs.tdep.workers.dev/", requestOptions)
    response = await response.text()
    return response
}
const readIPFSData = async (ipfsHash) => {
    let response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
    let data = await response.text()
    return JSON.parse(data).data
}


// Op tx util
const manageDataUpload = async (PK, dataName, data, seqNum, network, StellarSDK) => {
    const account = new StellarSDK.Account(PK, `${seqNum}`);
    let tx = new StellarSDK.TransactionBuilder(account, {
        fee: 100,
        networkPassphrase: StellarSDK.Networks[network],
    })
        .addOperation(
            StellarSDK.Operation.manageData({
                name: dataName,
                value: data
            })
        )
        .setTimeout(100)
        .build();
    return tx
}


// Raw decryption & encryption
function AESDecrypt(encryptString, key) {
  const algorithm = 'aes256';
  const decipher = crypto.createDecipher(algorithm, key);
  return decipher.update(encryptString, 'hex', 'utf8') +
    decipher.final('utf8');
}
function AESEncrypt(plaintext, key) {
  const algorithm = 'aes256';
  const encipher = crypto.createCipher(algorithm, key);
  const encrypted = Buffer.concat([encipher.update(plaintext), encipher.final()]);
  return encrypted.toString("hex")
}



/*
                             _       
                            | |      
   _____  ___ __   ___  _ __| |_ ___ 
  / _ \ \/ / '_ \ / _ \| '__| __/ __|
 |  __/>  <| |_) | (_) | |  | |_\__ \
  \___/_/\_\ .__/ \___/|_|   \__|___/
           | |                       
           |_|                       
*/

// Choose horizon base url
exports.setHorizon = (base_url) => {
    HORIZON_BASE = base_url
}


// Build encryption transaction
exports.encryptionTX = async (userPK, pin, network, StellarSDK) => {    
    const account = new StellarSDK.Account(userPK, `${pin}`) 
    let tx = new StellarSDK.TransactionBuilder(account, {fee:'100', networkPassphrase:StellarSDK.Networks[network], timebounds:{minTime:1, maxTime:1}})
	.addOperation(StellarSDK.Operation.manageData(
	    {
		name:"why this OP",
		value:"we need this transaction to have one operation."
	    }
	))
    tx = await tx.build()
    return tx.toEnvelope().toXDR('base64')
}

// Encrypt the data
exports.encryptData = async (signedEnvelope, dataName, data, network, StellarSDK) => {
    const signedTX = new StellarSDK.TransactionBuilder.fromXDR(signedEnvelope, StellarSDK.Networks[network])
    const txSignature = signedTX._signatures[0]._attributes.signature.toString('base64')
    const encrypted = AESEncrypt(data, txSignature)
    const ipfsHash = await uploadToIPFS(dataName, encrypted)
    return ipfsHash
}

// Upload the ipfs hash to Stellar
exports.storeData = async (sourcePK, dataName, data, network, StellarSDK) => {
    let uploadTX = await manageDataUpload(sourcePK, dataName, data, await readStellarAccountSequenceNumber(sourcePK), network, StellarSDK)
    return uploadTX.toEnvelope().toXDR('base64')
}

// Prepackaged tx submit utility
exports.sumbitStellarSignedTX = async (tx) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    var urlencoded = new URLSearchParams();
    urlencoded.append("tx", tx);
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
    };
    let response = await fetch(`https://${HORIZON_BASE}/transactions`, requestOptions)
    console.log(response)
    return response;
}

// Resolve and decrypt the encrypted data
exports.decryptData = async (sourcePK, dataName, network, signedEnvelope, StellarSDK) => {
    const signedTX = new StellarSDK.TransactionBuilder.fromXDR(signedEnvelope, StellarSDK.Networks[network])
    const txSignature = signedTX._signatures[0]._attributes.signature.toString('base64')

    const dataAttrs = await readStellarAccountDataAttributes(sourcePK)
    const ipfsHash = dataAttrs[dataName]

    const encrypted = await readIPFSData(ipfsHash)
    console.log(encrypted)
    const decrypted = AESDecrypt(encrypted, txSignature)
    return decrypted
}
