<img src="https://pbs.twimg.com/profile_images/1528350631215390720/7ZVZQlmR_400x400.jpg" width="600"/>

# Stensitive npm package

[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/joaomlourenco/novathesis/graphs/commit-activity)
[![made-with-js](https://img.shields.io/badge/Made%20with-JS-1f425f.svg?color=green)](https://www.latex-project.org/)
[![Stellar](https://img.shields.io/badge/Built-on-Stellar%20v1.3c-green.svg)](https://www.latex-project.org/lppl/lppl-1-3c)


--------
## Table of Contents

* [About](#about)
* [Getting Started](#getting-started)
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

### Usage

We will split this quick guide in three sections:
1. Setup
2. Store data
3. Read stored data

#### Setup

You will need to import the stensitive module:

`import StensitiveAgent from "stensitive"`

If you whish to use an horizon endpoint wich is not the testnet:

```js
StensitiveAgent.setHorizon("horizon base url") // Example: "horizon-testnet.stellar.org"
```

#### Store data

This process can be splitted in two:
1. Encrypt the data
2. Upload the data

To encrypt the data, the user will first need to sign an encryption transaction. This transaction is obtained with:

```js
const tx = await StensitiveAgent.encryptionTX({user public key}, {user-chosen pin}, {stellar network}, {StellarSdk});
```

You are giving this function 4 arguments:
- The user public key, which is the Stellar public key of the user that wants to encrypt and upload the data
- The user-chosen pin, which is a numeric pin that is inputed by the user. This is the key point of the security of stensitive, but it offers further security.
- The stellar network to use, for example "TESTNET".
- The stellar sdk. As of now, stensitive requires to pass the desired
