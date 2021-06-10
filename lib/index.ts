import * as EvmChains from 'evm-chains'
import Web3 from 'web3'
import ERC20 from './ABIs/ERC20.json'
import Comptroller from './ABIs/Comptroller.json'
import CompoundLens from './ABIs/CompoundLens.json'
import Comp from './ABIs/Comp.json'
import bETH from './ABIs/bETH.json'
import bToken from './ABIs/bToken.json'
import Reward from './ABIs/Reward.json'
import { ZERO } from 'utils/constants'

const DEFAULT_REFRESH = 5 * 1000

export const call =
  (method: (...args: any) => any) =>
  (...args: any) =>
    method(...args).call() as Promise<any>
export const send =
  (method: (...args: any) => any) =>
  (...args: any) => {
    const option = args.pop()
    const transaction = method(...args)
    return {
      estimate: (): Promise<any> =>
        transaction.estimateGas(option) as Promise<any>,
      send: (): Promise<any> => transaction.send(option) as Promise<any>,
      transaction,
    }
  }

interface Options {
  readonly onEvent?: (type: string, payload: any, error: any) => void
  readonly addresses: any
  readonly markets: any
}

interface Wallet {
  address?: string
  network?: number
}

class BasedLoanLibrary {
  public initiated: boolean
  public web3: Web3
  public contracts: any
  public methods: any
  public addresses: any
  public markets: any
  public Markets: any
  public Farms: any
  public BTokens: any
  private wallet: Wallet = {}
  private options: any
  private subscriptions: any[] = []
  private timers: NodeJS.Timeout[] = []

  constructor(provider: any, options: Options) {
    this.web3 = new Web3(provider)
    this.options = options
    this.init(provider)
  }

  get onEvent() {
    return this.options.onEvent
  }

  public setProvider(provider: any) {
    this.init(provider)
  }

  public onDisconnect() {
    this.disconnect()
  }

  private reset() {
    this.subscriptions.forEach((subscription) => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe()
      } else if (subscription.deleteProperty) {
        subscription.deleteProperty()
      }
    })
    this.timers.forEach((timer) => clearInterval(timer))
  }

  private async setupWallet() {
    let status = 0 // No updates
    const chainId = await this.web3.eth.getChainId()
    const { networkId: network } = await EvmChains.getChain(chainId)
    const [address] = await this.web3.eth.getAccounts()
    if (this.wallet.address && !address) {
      return this.disconnect()
    } else if (this.wallet.network && this.wallet.network !== network) {
      status = 1
    } else if (this.wallet.address !== address) {
      status = 2
    }
    this.wallet.network = network
    this.wallet.address = address
    if (status === 1 || !this.markets) {
      this.addresses = this.options.addresses[this.wallet.network]
      this.markets = this.options.markets[this.wallet.network] || []
    }
    return status
  }

  private async initWallet(refresh: boolean = false) {
    if (!this.initiated) return
    const status = await this.setupWallet()
    if (refresh || status > 0) {
      this.onEvent({
        data: [this.wallet, this.markets],
        event: 'WALLET',
        status,
      })
    }
  }

  private connect() {
    this.initWallet(true)
  }

  private disconnect(event = false) {
    this.initiated = false
    if (!this.wallet.address) return
    if (!event && this.web3.givenProvider.disconnect) {
      this.web3.givenProvider.disconnect()
    }
    delete this.wallet.address
    this.reset()
    this.onEvent({
      event: 'WALLET',
      status: 3,
    })
  }

  private async init(givenProvider?: any) {
    this.initiated = false
    this.reset()
    if (givenProvider) this.web3 = new Web3(givenProvider)
    const provider = givenProvider || this.web3.givenProvider
    const status = await this.setupWallet()
    const { addresses, markets = [], onEvent } = this

    if (givenProvider) {
      this.subscriptions = [
        provider.on && provider.on('accountsChanged', () => this.initWallet()),
        provider.on && provider.on('chainChanged', () => this.init()),
        provider.on && provider.on('connect', () => this.connect()),
        provider.on && provider.on('disconnect', () => this.disconnect(true)),
      ].filter((item) => !!item)
    }

    if (addresses) {
      this.Markets = markets.map((market) => [
        market,
        new this.web3.eth.Contract(ERC20 as any, market.underlyingAddress),
      ])
      this.Farms = addresses.Farms.map((farm) => [
        farm,
        new this.web3.eth.Contract(Reward as any, farm.contractAddress),
        new this.web3.eth.Contract(ERC20 as any, farm.underlyingAddress),
      ])
      this.BTokens = markets.map((market) => [
        market,
        new this.web3.eth.Contract(
          (market.underlyingAddress === ZERO ? bETH : bToken) as any,
          this.web3.utils.toChecksumAddress(market.id)
        ),
      ])

      this.contracts = {
        Comptroller: new this.web3.eth.Contract(
          Comptroller as any,
          addresses.Unitroller
        ),
        CompoundLens: new this.web3.eth.Contract(
          CompoundLens as any,
          addresses.CompoundLens
        ),
        Comp: new this.web3.eth.Contract(Comp as any, addresses.Comp),
      }
      this.subscriptions.push(
        this.contracts.Comptroller.events.allEvents({}).on('data', onEvent)
      )

      this.timers = [
        setInterval(
          () => this.initWallet(),
          this.options.interval || DEFAULT_REFRESH
        ),
      ]

      const getERC20Methods = (contract: any) =>
        contract && {
          approve: send(contract.methods.approve),
          getAllowance: call(contract.methods.allowance),
          getBalance: call(contract.methods.balanceOf),
          totalSupply: call(contract.methods.totalSupply),
        }

      const getFarmMethods = (contract: any) =>
        contract && {
          startTime: call(contract.methods.starttime),
          getBalance: call(contract.methods.balanceOf),
          getRewardBalance: call(contract.methods.earned),
          stake: send(contract.methods.stake),
          withdraw: send(contract.methods.withdraw),
          claim: send(contract.methods.getReward),
          exit: send(contract.methods.exit),
        }

      const getBTokenMethods = (contract: any) =>
        contract && {
          mint: send(contract.methods.mint),
          redeem: send(contract.methods.redeem),
          redeemUnderlying: send(contract.methods.redeemUnderlying),
          borrow: send(contract.methods.borrow),
          repayBorrow: send(contract.methods.repayBorrow),
          getBalance: call(contract.methods.balanceOf),
          getCash: call(contract.methods.getCash),
          balanceOfUnderlying: call(contract.methods.balanceOfUnderlying),
          borrowBalanceCurrent: call(contract.methods.borrowBalanceCurrent),
          supplyRatePerBlock: call(contract.methods.supplyRatePerBlock),
          borrowRatePerBlock: call(contract.methods.borrowRatePerBlock),
        }

      this.methods = {
        Comptroller: {
          allMarkets: call(this.contracts.Comptroller.methods.allMarkets),
          getAllMarkets: call(this.contracts.Comptroller.methods.getAllMarkets),
          markets: call(this.contracts.Comptroller.methods.markets),
          getAssetsIn: call(this.contracts.Comptroller.methods.getAssetsIn),
          compRate: call(this.contracts.Comptroller.methods.compRate),
          compSpeeds: call(this.contracts.Comptroller.methods.compSpeeds),
          compAccrued: call(this.contracts.Comptroller.methods.compAccrued),
          enterMarkets: send(this.contracts.Comptroller.methods.enterMarkets),
          exitMarket: send(this.contracts.Comptroller.methods.exitMarket),
          claimComp: send(this.contracts.Comptroller.methods.claimComp),
        },
        CompoundLens: {
          getCompBalanceMetadataExt: (account) =>
            call(this.contracts.CompoundLens.methods.getCompBalanceMetadataExt)(
              addresses.Comp,
              addresses.Unitroller,
              account
            ),
        },
        Comp: {
          balanceOf: call(this.contracts.Comp.methods.balanceOf),
        },
        Market: getERC20Methods,
        Farm: getFarmMethods,
        BToken: getBTokenMethods,
        web3: {
          getBlock: (field: string = 'timestamp') =>
            new Promise((resolve, reject) =>
              this.web3.eth
                .getBlock('latest')
                .then((block: any) => {
                  if (field) {
                    resolve(block[field])
                  } else {
                    resolve(block)
                  }
                })
                .catch(reject)
            ),
        },
      }
    }

    this.onEvent({
      data: [this.wallet, markets],
      event: 'WALLET',
      status,
    })
    this.initiated = true
  }

  public Market(market) {
    const match = this.Markets.find(
      (item) => item[0].underlyingAddress === market.underlyingAddress
    )
    return match ? match[1] : null
  }

  public Farm(farm) {
    const match = this.Farms.find(
      (item) => item[0].contractAddress === farm.contractAddress
    )
    return match ? { farmContract: match[1], tokenContract: match[2] } : null
  }

  public BToken(market) {
    const match = this.BTokens.find(
      (item) => item[0].underlyingAddress === market.underlyingAddress
    )
    return match ? match[1] : null
  }

  public updateMarkets(markets) {
    this.options.markets[this.wallet.network] = markets
    this.markets = this.options.markets[this.wallet.network] || []
    this.onEvent({
      data: this.markets,
      event: 'MARKETS',
      status,
    })
  }
}

export default BasedLoanLibrary
