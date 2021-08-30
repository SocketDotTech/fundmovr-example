# FundMovr Example Usage

Get access to all bridges connecting multiple chains in a single SDK integration. This repository creates an example integration with the `fund-movr-sdk` to showcase its capabilities.

This example sends 1 USDC from polygon mainnet to xDai mainnet

## Installation

```bash
$ npm install 
```

## Run the example

### Step 1

We need to get access to RPCs for the chains we want to bridge between. You can get them from [Alchemy](https://alchemyapi.io) and/or [Infura](https://infura.io/)

```bash
$ cp .env.sample .env
```

Now update the `.env` with your RPC urls

### Step 2

Let's run the example now!

```bash
$ node index.js
```

**Please feel free to create github issues if you incounter issues or reach out to us at contact@movr.network**
