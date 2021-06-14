import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import { TMap } from 'types'
import Button from 'components/Button/Button'
import AssetInfo from 'components/AssetInfo/AssetInfo'
import TxLoader from 'components/TxLoader/TxLoader'
import Modal from './Modal'
import styles from './Modal.module.css'
import { ZERO } from 'utils/constants'
import { toFixed } from 'utils/number'

interface ISupplyModal {
  network?: number
  pending: boolean
  market: any
  balance: number
  current: number
  gas: number
  borrowLimit: number
  borrowLimitUsed: number
  supplyRatePerBlock: number
  totalBorrow: number
  totalSupply: number
  assetsIn: string[]
  allowed: boolean
  distributeApy: string
  disabled: string
  onSubmit: Function
  onClose: Function
  closeOnEscape?: boolean
}

const defaults = {
  supplyAmount: 0,
  withdrawAmount: 0,
}

export default function SupplyModal({
  network,
  pending,
  market,
  balance,
  current,
  gas,
  borrowLimit,
  borrowLimitUsed,
  supplyRatePerBlock,
  totalBorrow,
  totalSupply,
  assetsIn,
  allowed,
  distributeApy,
  disabled,
  onSubmit,
  onClose,
  closeOnEscape,
}: ISupplyModal) {
  const [tab, setTab] = useState('supply')
  const [form, setForm] = useState<TMap>(defaults)
  const { supplyAmount, withdrawAmount } = form
  const blocksPerDay = 4 * 60 * 24
  const daysPerYear = 365
  const maxSupply =
    market && (market.underlyingAddress === ZERO ? balance - gas * 2 : balance)
  const assetIn =
    market &&
    assetsIn &&
    assetsIn.some((item) => item.toLowerCase() === market.id)

  const available =
    market &&
    toFixed(
      assetIn && !new BigNumber(market.collateralFactor).isZero()
        ? Math.min(
            Math.min(
              new BigNumber(totalSupply)
                .minus(new BigNumber(totalBorrow).div(market.collateralFactor))
                .div(market.underlyingPriceUSD)
                .toNumber(),
              market.supplyBalance
            ),
            market.cash
          )
        : Math.min(market.supplyBalance, market.cash),      
      market.underlyingDecimals
    )

  const handleInput = (e) => {
    let value = (e.target.value || '').replace(/[^.\d]/g, '')
    if (value.endsWith('.')) {
      value = value.replace(/\./g, '') + '.'
    } else {
      if (value) {
        value =
          Number(value) !== 0
            ? toFixed(value, market.underlyingDecimals, true)
            : value
      }
    }
    setForm({ ...form, [e.target.name]: value.toString() })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (tab === 'supply') {
      onSubmit({ amount: supplyAmount, type: tab })
    } else {
      onSubmit({ amount: withdrawAmount, type: tab })
    }
  }

  useEffect(() => {
    if (tab !== 'supply' || supplyAmount > 0) {
      setTab('supply')
      setForm(defaults)
    }
  }, [market])

  return (
    <Modal
      show={!!market}
      title={
        allowed
          ? `${tab === 'supply' ? 'Supply' : 'Withdraw'} Token`
          : 'Approve Token'
      }
      onRequestClose={onClose}
      closeOnEscape={closeOnEscape}
      loading={pending}
    >
      {pending ? (
        <TxLoader hash={pending ? disabled : ''} network={network} />
      ) : (
        <>
          <div className={styles.tabs}>
            <Button
              className={tab === 'supply' ? styles.active : ''}
              onClick={() => tab !== 'supply' && setTab('supply')}
            >
              Supply
            </Button>
            <Button
              className={tab === 'withdraw' ? styles.active : ''}
              onClick={() => tab !== 'withdraw' && setTab('withdraw')}
            >
              Withdraw
            </Button>
          </div>
          {market && (
            <form onSubmit={handleSubmit} className={styles.form}>
              {tab === 'supply' && (
                <>
                  {allowed ? (
                    <div className={styles.field}>
                      <label htmlFor="supplyAmount">
                        Amount ({market.underlyingSymbol}){' '}
                        <span
                          onClick={() =>
                            setForm({
                              ...form,
                              supplyAmount: maxSupply,
                            })
                          }
                        >
                          [max - {toFixed(balance, 4)}]
                        </span>
                      </label>
                      <input
                        id="supplyAmount"
                        name="supplyAmount"
                        type="text"
                        value={supplyAmount}
                        onChange={handleInput}
                      />
                    </div>
                  ) : (
                    <p>
                      To Supply or Repay {market.underlyingSymbol} to the Based
                      Loans, you need to enable it first.
                    </p>
                  )}
                  <AssetInfo
                    infoType="supply"
                    assetUrl={`/assets/cryptologos/${market.underlyingSymbol
                      .split(' ')[0]
                      .toLowerCase()}.${
                      [
                        'BLO',
                        'DPI',
                        'AKITA',
                        'ELON',
                        'KISHU',
                        'SHIB',
                        'TNT',
                      ].includes(market.underlyingSymbol)
                        ? 'png'
                        : 'svg'
                    }`}
                    isBorrowLimitInfo={allowed}
                    borrowLimit={borrowLimit}
                    borrowLimitUsed={borrowLimitUsed}
                    distributeApy={distributeApy}
                    apy={new BigNumber(supplyRatePerBlock * blocksPerDay + 1)
                      .pow(daysPerYear)
                      .minus(1)
                      .times(100)
                      .dp(2, 1)
                      .toString(10)}
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={
                        disabled ||
                        (allowed &&
                          (supplyAmount <= 0 || supplyAmount > maxSupply))
                      }
                    >
                      {allowed ? 'Supply' : 'Enable'}
                    </Button>
                  </div>
                  <div className={`${styles.balance} flex justify-between`}>
                    <span>Wallet Balance</span>
                    <span>
                      {balance} {market.underlyingSymbol}
                    </span>
                  </div>
                </>
              )}
              {tab === 'withdraw' && (
                <>
                  <div className={styles.field}>
                    <label htmlFor="withdrawAmount">
                      Amount ({market.underlyingSymbol}){' '}
                      <span
                        onClick={() =>
                          setForm({
                            ...form,
                            withdrawAmount: available,
                          })
                        }
                      >
                        [max - {toFixed(available, 4)}]
                      </span>
                    </label>
                    <input
                      id="withdrawAmount"
                      name="withdrawAmount"
                      type="text"
                      value={withdrawAmount}
                      onChange={handleInput}
                    />
                  </div>
                  <AssetInfo
                    infoType="supply"
                    assetUrl={`/assets/cryptologos/${market.underlyingSymbol
                      .split(' ')[0]
                      .toLowerCase()}.${
                      [
                        'BLO',
                        'DPI',
                        'AKITA',
                        'ELON',
                        'KISHU',
                        'SHIB',
                        'TNT',
                      ].includes(market.underlyingSymbol)
                        ? 'png'
                        : 'svg'
                    }`}
                    apy={new BigNumber(supplyRatePerBlock * blocksPerDay + 1)
                      .pow(daysPerYear)
                      .minus(1)
                      .times(100)
                      .dp(2, 1)
                      .toString(10)}
                    borrowLimit={borrowLimit}
                    borrowLimitUsed={borrowLimitUsed}
                    distributeApy={distributeApy}
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={
                        disabled ||
                        withdrawAmount <= 0 ||
                        withdrawAmount > market.supplyBalance
                      }
                    >
                      Withdraw
                    </Button>
                  </div>
                  <div className={`${styles.balance} flex justify-between`}>
                    <span>Currently Supplying</span>
                    <span>
                      {current} {market.underlyingSymbol}
                    </span>
                  </div>
                </>
              )}
            </form>
          )}
        </>
      )}
    </Modal>
  )
}
