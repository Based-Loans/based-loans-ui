import { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import { TMap } from 'types'
import Button from 'components/Button/Button'
import AssetInfo from 'components/AssetInfo/AssetInfo'
import TxLoader from 'components/TxLoader/TxLoader'
import Modal from './Modal'
import styles from './Modal.module.css'
import { toFixed } from 'utils/number'
import { ZERO } from 'utils/constants'

interface IBorrowModal {
  network?: number
  pending: boolean
  market: any
  balance: number
  walletBalance: string
  borrowLimit: number
  totalBorrow: number
  borrowLimitUsed: number
  borrowRatePerBlock: number
  allowed: boolean
  distributeApy: string
  disabled: string
  onSubmit: Function
  onClose: Function
  closeOnEscape?: boolean
}

const defaults = {
  borrowAmount: 0,
  repayAmount: 0,
}

export default function BorrowModal({
  network,
  pending,
  market,
  balance,
  walletBalance,
  borrowLimit,
  borrowLimitUsed,
  borrowRatePerBlock,
  totalBorrow,
  allowed,
  distributeApy,
  disabled,
  onSubmit,
  onClose,
  closeOnEscape,
}: IBorrowModal) {
  const blocksPerDay = 4 * 60 * 24
  const daysPerYear = 365
  const [tab, setTab] = useState('borrow')
  const [form, setForm] = useState<TMap>(defaults)
  const { borrowAmount, repayAmount } = form
  const borrowed = (borrowLimit * (100 - borrowLimitUsed)) / 100
  const available = market
    ? new BigNumber(borrowed)
        .times(0.8)
        .isGreaterThan(new BigNumber(market.cash))
      ? new BigNumber(market.cash)
      : new BigNumber(borrowed)
          .times(0.8)
          .dp(market.underlyingDecimals, 1)
          .toString(10)
    : 0
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
    if (tab === 'borrow') {
      onSubmit({ amount: borrowAmount, type: tab })
    } else {
      onSubmit({
        amount:
          market.underlyingAddress === ZERO
            ? repayAmount
            : repayAmount === balance
            ? -1
            : repayAmount,
        type: tab,
      })
    }
  }

  useEffect(() => {
    if (tab !== 'borrow' || borrowAmount > 0) {
      setTab('borrow')
      setForm(defaults)
    }
  }, [market])

  return (
    <Modal
      show={!!market}
      title={
        allowed
          ? `${tab === 'borrow' ? 'Borrow' : 'Repay'} Token`
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
              className={tab === 'borrow' ? styles.active : ''}
              onClick={() => tab !== 'borrow' && setTab('borrow')}
            >
              Borrow
            </Button>
            <Button
              className={tab === 'repay' ? styles.active : ''}
              onClick={() => tab !== 'repay' && setTab('repay')}
            >
              Repay
            </Button>
          </div>
          {market && (
            <form onSubmit={handleSubmit} className={styles.form}>
              {tab === 'borrow' && (
                <>
                  <div className={styles.field}>
                    <label htmlFor="borrowAmount">
                      Amount ({market.underlyingSymbol}){' '}
                      <span
                        onClick={() =>
                          setForm({
                            ...form,
                            borrowAmount: available,
                          })
                        }
                      >
                        [max - {toFixed(available, 4)}]
                      </span>
                    </label>
                    <input
                      id="borrowAmount"
                      name="borrowAmount"
                      type="text"
                      value={borrowAmount}
                      onChange={handleInput}
                    />
                  </div>
                  <AssetInfo
                    infoType="borrow"
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
                    apy={new BigNumber(borrowRatePerBlock * blocksPerDay + 1)
                      .pow(daysPerYear)
                      .minus(1)
                      .times(100)
                      .dp(2, 1)
                      .toString(10)}
                    borrowLimitUsed={borrowLimitUsed}
                    borrowBalance={totalBorrow}
                    distributeApy={distributeApy}
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={
                        disabled ||
                        +borrowAmount <= 0 ||
                        +borrowAmount > +available
                      }
                    >
                      Borrow
                    </Button>
                  </div>
                  <div className={`${styles.balance} flex justify-between`}>
                    <span>Currently Borrowing</span>
                    <span>
                      {balance} {market.underlyingSymbol}
                    </span>
                  </div>
                </>
              )}
              {tab === 'repay' && (
                <>
                  {allowed ? (
                    <div className={styles.field}>
                      <label htmlFor="repayAmount">
                        Amount ({market.underlyingSymbol}){' '}
                        <span
                          onClick={() =>
                            setForm({
                              ...form,
                              repayAmount: balance,
                            })
                          }
                        >
                          [max - {toFixed(balance, 4)}]
                        </span>
                      </label>
                      <input
                        id="repayAmount"
                        name="repayAmount"
                        type="text"
                        value={repayAmount}
                        onChange={handleInput}
                      />
                    </div>
                  ) : (
                    <p>
                      To Borrow or Repay {market.underlyingSymbol} to the Based
                      Loans, you need to enable it first.
                    </p>
                  )}
                  <AssetInfo
                    infoType="borrow"
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
                    apy={new BigNumber(borrowRatePerBlock * blocksPerDay + 1)
                      .pow(daysPerYear)
                      .minus(1)
                      .times(100)
                      .dp(2, 1)
                      .toString(10)}
                    borrowLimitUsed={borrowLimitUsed}
                    borrowBalance={totalBorrow}
                    distributeApy={distributeApy}
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={
                        disabled ||
                        (allowed &&
                          (repayAmount <= 0 ||
                            (repayAmount > balance &&
                              Number(walletBalance) < repayAmount)))
                      }
                    >
                      {allowed ? 'Repay' : 'Enable'}
                    </Button>
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
