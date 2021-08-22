const {
  Movr,
  Chain,
  Token,
  RouteOptions,
  WatcherEvent,
} = require('@movr/fund-movr-sdk')

const ethers = require('ethers')
require('dotenv').config()

// @notice create a provider with sending chain rpc
const provider = new ethers.providers.JsonRpcProvider(
  process.env.POLYGON_RPC_NODE,
)

// @notice sending account
const signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider)

//  @notice  create a Movr object
const movr = new Movr(signer)


// @notice here we create two chain objects passing chainId along with rpc node url
// one for sending chain other for destination
const sendingChain = new Chain(137, process.env.POLYGON_RPC_NODE)
const destinationChain = new Chain(100, process.env.XDAI_RPC_NODE)

async function main() {
  
  // USDC address on polygon 
  // https://polygonscan.com/address/0x2791bca1f2de4661ed88a30c99a7a9449aa84174
  const USDC_POLGYON_ADDRESS =  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'

  // @notice we create a token object with token address and passing chain object
  const token = new Token(
    USDC_POLGYON_ADDRESS,
    sendingChain,
  )

  // @notice amount to be passed in string
  // eg. for 1 USDC coin  we pass '1000000' since it have 6 decimals
  const amount = '1000000'

  // @notice here we call movr estimateFee with RouteOptions.MaxOutput
  // it can be RouteOptions.CheapestRoute with lowest gas fees
  // or it can be RouteOptions.FastestRoute for fastest route
  // it returns quotes with various routes
  const result = await movr
    .connect(signer)
    .move(token, sendingChain, destinationChain)
    .estimateFee(RouteOptions.MaxOutput, amount )
  
  // prints the estimateFee result
  console.log('quote ', result)
  
  // @notice here we select a route which suits our need
  const route = result.routes[0]

  // prints the select route
  console.log('sending route ', route)
  
  // @notice here we use approveAndSendWithRoute methods which approves the token and send via passed route
  // it returns array with transaction there for tx, and a object with isClaimRequired and bridgeName
  // if isClaimRequired is required is true then we require to call claim methods see the code below
  // since some bridges requires two step process thats why we require separate claim function
  // example tx -> https://polygonscan.com/tx/0x02d4ff18f6a42047322d55d1881743c0365679f733b6811048c81cf83b978c39
  const [tx, { isClaimRequired, bridgeName }] = await movr
    .connect(signer)
    .move(token, sendingChain, destinationChain)
    .approveAndSendWithRoute(route)
  

  console.log(tx, isClaimRequired, bridgeName)

  // @notice here we wait for transaction to be completerd
  await tx.wait()

  // @notice this is watch function for listening to various events that can occur while transaction is 
  // reached on other side.
  // WatcherEvent.ClaimToBeStarted is only called when claim function is required to be called
  // bridgeName can be extracted while sending
  // example source tx -> https://polygonscan.com/tx/0x02d4ff18f6a42047322d55d1881743c0365679f733b6811048c81cf83b978c39
  // destination tx -> https://blockscout.com/xdai/mainnet/tx/0xa578a3c31b60d28c13a5ad0efb7d06f017ab41213ebca4e353eb098c4ee8bc8d
  // this example uses hop bridge, you can pass 'hop' and source transaction to try watcher without sending your transaction
  movr
    .watch(tx.hash, sendingChain, destinationChain, token, bridgeName)
    .on(WatcherEvent.SourceTxStarted, (data) => {
      console.log('🚀 Source Tx Started ', data)
    })
    .on(WatcherEvent.SourceTxCompleted, (data) => {
      console.log('🚀 Source Tx ', data)
    })
    .on(WatcherEvent.ClaimToBeStarted, async (data) => {
      console.log('🚀 Claim to be started ', data)

      //@notice here we run claim function
      // it is only triggered if sending bridge have two step process
      const claimTx = await movr
        .connect(signer)
        .claim(data.txHash, sendingChain, destinationChain)
      
      await claimTx.wait()
      
      console.log(claimTx)
    
    })
    .on(WatcherEvent.DestinationTxStarted, (data) => {
      console.log('🚀 Destination Tx Started ', data)
    })
    .on(WatcherEvent.DestinationTxCompleted, (data) => {
      console.log('🚀 Destination Tx Ended', data)
    })
}

main()
