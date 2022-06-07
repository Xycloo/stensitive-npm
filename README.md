<img src="https://pbs.twimg.com/profile_images/1528350631215390720/7ZVZQlmR_400x400.jpg" width="200"/>

# 📦 Stensitive npm package 📦

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)]()
[![made-with-js](https://img.shields.io/badge/Made%20with-javascript-1f425f.svg?color=green)]()
[![built-on-stellar](https://img.shields.io/badge/Built%20with-stellar-1f425f.svg?color=green)]()


--------
## Table of Contents

* [About](#about)
* [Getting Started](#getting-started)
  * [Installation](#installation)
  * [Setup](#setup)
  * [Store data](#store-data)
  * [Read data](#read-the-data)
* [Things to keep in mind](#notice)
	* [Never submit the encryption transaction](#encryption-transaction)
	* [Speed](#speed)
	
--------

## About

Developed by Xycloo, stensitive-npm is the NPM package that allows to encrypt & decrypt sensitive data from your Stellar wallet with Javascript.

Read more about stensitive [on our website](https://xycloo.com/stensitive)

### Cross-wallet, but not cross-chain

You can use stensitive with any stellar wallet as long as it can sign transactions and provide the user's public key. However, stensitive works only on the Stellar Blockchain.

## Getting Started

### Installation

To install, open your working directory on your terminal and type:

`npm install stensitive`

And that's it.

We will split this quick guide in three sections:
1. Setup
2. Store data
3. Read stored data

### Setup

You will need to import the stensitive module:

`import StensitiveAgent from "stensitive"`

If you whish to use an horizon endpoint wich is not the testnet:

```js
StensitiveAgent.setHorizon("horizon base url") // Example: "horizon-testnet.stellar.org"
```

Furthermore, you will have to either install the StellarSDK or load it through a script tag (the below tag requests version 10.1.0, always stay up-to-date with the stellar versions):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/10.1.0/stellar-sdk.js"></script>
```

### Store data

This process can be splitted in three:
1. Get the encryption transaction.
2. Encrypt the data.
3. Upload the data.


#### Get encryption transaction
The user will need to sign an encryption transaction. This transaction is obtained with:

```js
const tx = await StensitiveAgent.encryptionTX({user public key}, {user-chosen pin}, {stellar network}, {StellarSdk});
```

You are giving this function 4 arguments:
- The user public key, which is the Stellar public key of the user that wants to encrypt and upload the data
- The user-chosen pin, which is a numeric pin that is inputed by the user. This is the key point of the security of stensitive, but it offers further security.
- The stellar network to use, for example "TESTNET".
- The stellar sdk. As of now, stensitive requires to pass the desired verision of the Stellar SDK. We may change this design in the future.

This transaction is then to be signed by the user with the desired wallet.

#### Encrypt the data

This is the step of actually encrypting the data, which will use the signed encryption tx:

```js
const ipfsHash = await StensitiveAgent.encryptData({signed transaction}, {data name}, {data}, {stellar network}, {StellarSdk});
```

You are giving this function 5 arguments:
- The signed encryption transaction.
- The name of the data to store and encrypt.
- The data you want to store and encrypt.
- The stellar network to use, for example "TESTNET".
- The stellar sdk. As of now, stensitive requires to pass the desired verision of the Stellar SDK. We may change this design in the future.

This function will also take care of uploading the encrypted data to IPFS, in fact the function will return the IPFS hash from which you'll be able to fetch the encrypted data.


#### Storing the data

This last step consists in adding the IPFS hash we obtained as a data attribute in the user's account:

```js
const uploadTX = await StensitiveAgent.storeData({user public key}, {data name}, {ipfs hash}, {stellar network}, {StellarSdk});
```

You are giving this function 5 arguments:
- The public key of the user
- The name of the data to store and encrypt.
- The ipfs hash we obtained with the previous step
- The stellar network to use, for example "TESTNET".
- The stellar sdk. As of now, stensitive requires to pass the desired verision of the Stellar SDK. We may change this design in the future.

Then, we will have to sign and submit this transaction in order for the changes to be applied on the Stellar network:

```js
StensitiveAgent.sumbitStellarSignedTX(signedUploadTx).then(response => {
	// do something with the response
})
```

### Example of storing data with XBull wallet

Now let's take a look at an example of storing wallet-encrypted data that uses the XBull wallet.

```js
// define data to store
let data = "some data"
let name = "some data name"
let pin = 12345
    

// get wallet permissions
const permissions = await xBullSDK.connect({
      canRequestPublicKey: true,
      canRequestSign: true
});

// get public key of the user
const userPK = await xBullSDK.getPublicKey();

// generate the encryption transaction and sign it
const tx = await StensitiveAgent.encryptionTX(userPK, pin, "TESTNET", StellarSdk);
const signedTransaction = await xBullSDK.signXDR(tx, {
	publicKey: userPK,
	network: StellarSdk.Networks.TESTNET
});

// get the ipfs hash of our encrypted data
const ipfsHash = await StensitiveAgent.encryptData(signedTransaction, name, data, "TESTNET", StellarSdk);

// build the transaction to store the Ipfs hash on the user's account, sign it, and submit it
const uploadTX = await StensitiveAgent.storeData(userPK, name, ipfsHash, "TESTNET", StellarSdk);
const signedUploadTx = await xBullSDK.signXDR(uploadTX)
StensitiveAgent.sumbitStellarSignedTX(signedUploadTx).then(response => {
	// do something with the response
})
```

### Read the data

This will be easier and faster, we split this process in two:
1. get the encryption transaction.
2. retrieve and decode the data.

#### Get the encryption transaction
The user will need to sign an encryption transaction. This transaction is obtained with:

```js
const tx = await StensitiveAgent.encryptionTX({user public key}, {user-chosen pin}, {stellar network}, {StellarSdk});
```

You are giving this function 4 arguments:
- The user public key, which is the Stellar public key of the user that wants to encrypt and upload the data
- The user-chosen pin, which is a numeric pin that is inputed by the user. This is the key point of the security of stensitive, but it offers further security.
- The stellar network to use, for example "TESTNET".
- The stellar sdk. As of now, stensitive requires to pass the desired verision of the Stellar SDK. We may change this design in the future.

This transaction is then to be signed by the user with the desired wallet.

#### Retrieve and decode the data

```js
const decrypted = await StensitiveAgent.decryptData({user public key}, {data name}, {stellar network}, {signed encryption transaction}, {StellarSdk})
```
The data is now decrypted.

## Notice

### Encryption transaction
Never submit the encryption trasnaction since it may expose your data.

### Speed
This technology is based upon havin to fetch the horizon api multiple times and signing transaction. This means that this solution might not be the best if you are looking forward an extremely fast product.

However developers might want to expand this technology and only use the raw encryption/decrytion mechanism with a wallet and keep the encrypted data on a database wich will result in a much faster experience.

## Learn more

To learn about the technical details of stensitive, you can read the [whitepaper]()
