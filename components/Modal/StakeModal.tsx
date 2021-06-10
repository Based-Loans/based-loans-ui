import { useEffect, useState } from 'react'
import { TMap } from 'types'
import Button from 'components/Button/Button'
import TxLoader from 'components/TxLoader/TxLoader'
import Window from 'components/Window/Window'
import Modal from './Modal'
import styles from './Modal.module.css'
import { toFixed } from 'utils/number'

interface ISupplyModal {
  network: number
  type: string
  isOpen: boolean
  pending: boolean
  disabled: string
  farm: any
  allowed: boolean
  onSubmit: Function
  onClose: Function
  closeOnEscape?: boolean
}

const defaults = {
  amount: 0,
}

export default function StakeModal({
  network,
  type = 'stake',
  isOpen,
  pending,
  disabled,
  farm,
  allowed,
  onSubmit,
  onClose,
  closeOnEscape,
}: ISupplyModal) {
  const [audio, setAudio] = useState(null)
  // const [audios, setAudios] = useState(null)
  const [bugs, setBugs] = useState(0)
  const [bugMap, setBugMap] = useState(0)
  const [form, setForm] = useState<TMap>(defaults)
  const { amount } = form
  const maxBalance =
    type === 'stake' ? farm.balance || 0 : farm.stakedBalance || 0

  const handleInput = (e) => {
    let value = (e.target.value || '').replace(/[^.\d]/g, '')
    if (value.endsWith('.')) {
      value = value.replace(/\./g, '') + '.'
    } else {
      if (value) {
        value = Number(value) !== 0 ? toFixed(value, 18, true) : value
      }
    }
    setForm({ ...form, [e.target.name]: value.toString() })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ type, amount })
  }

  useEffect(() => {
    if (amount > 0) {
      setForm(defaults)
    }
    if (isOpen) {
      audio.play()
      setBugs(15)
    } else {
      setBugs(0)
    }
    setBugMap(0)
  }, [isOpen])

  useEffect(() => {
    // const audios = new Array(15)
    //   .fill(1)
    //   .map(() => new Audio('/assets/error.mp3'))
    // setAudios(audios)
    setAudio(new Audio('/assets/error.mp3'))
  }, [])

  return (
    <Modal
      show={!!isOpen}
      title={
        type === 'stake'
          ? `${allowed ? 'Stake' : 'Approve'} your tokens`
          : 'Unstake your tokens'
      }
      onRequestClose={bugs <= bugMap && onClose}
      closeOnEscape={closeOnEscape}
      loading={pending}
      extra={
        bugs > 0 &&
        new Array(bugs).fill(1).map((_, idx) => (
          <Window
            key={idx}
            labels={{
              title:
                type === 'stake'
                  ? `${allowed ? 'Stake' : 'Approve'} your tokens`
                  : 'Unstake your tokens',
            }}
            classes={{
              window: `${styles.window} ${styles.bug} ${
                bugMap > idx ? '' : 'hide'
              }`,
            }}
            onClose={bugs <= bugMap && onClose}
            onLoad={() => {
              setTimeout(() => {
                // audios[idx].play()
                setBugMap(idx + 1)
              }, (idx + 1) * 75)
            }}
          >
            <form onSubmit={handleSubmit} className={styles.form}>
              {allowed || type === 'unstake' ? (
                <div className={styles.field}>
                  <label htmlFor="amount">
                    Amount ({farm.asset}){' '}
                    <span
                      onClick={() =>
                        setForm({
                          ...form,
                          amount: maxBalance,
                        })
                      }
                    >
                      [max -{' '}
                      {type === 'stake'
                        ? toFixed(farm.balance || 0, 4)
                        : toFixed(farm.stakedBalance || 0, 4)}
                      ]
                    </span>
                  </label>
                  <input
                    id="amount"
                    name="amount"
                    type="text"
                    value={amount}
                    onChange={handleInput}
                  />
                </div>
              ) : (
                <p>
                  To Stake {farm.asset} to the Based Loans, you need to enable
                  it first.
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  disabled={
                    allowed &&
                    (Number(amount) <= 0 || Number(amount) > Number(maxBalance))
                  }
                >
                  {type === 'stake'
                    ? `${allowed ? 'Stake' : 'Enable'}`
                    : 'Unstake'}
                </Button>
              </div>
              <div className={`${styles.balance} flex justify-between`}>
                <span>Wallet Balance</span>
                <span>
                  {type === 'stake'
                    ? farm.balance || 0
                    : farm.stakedBalance || 0}{' '}
                  {farm.asset}
                </span>
              </div>
            </form>
          </Window>
        ))
      }
      className={pending ? styles.pending : styles.hide}
    >
      {pending ? (
        <TxLoader hash={pending ? disabled : ''} network={network} />
      ) : (
        isOpen && (
          <form onSubmit={handleSubmit} className={styles.form}>
            {allowed || type === 'unstake' ? (
              <div className={styles.field}>
                <label htmlFor="amount">
                  Amount ({farm.asset}){' '}
                  <span
                    onClick={() =>
                      setForm({
                        ...form,
                        amount: maxBalance,
                      })
                    }
                  >
                    [max -{' '}
                    {type === 'stake'
                      ? toFixed(farm.balance || 0, 4)
                      : toFixed(farm.stakedBalance || 0, 4)}
                    ]
                  </span>
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  value={amount}
                  onChange={handleInput}
                />
              </div>
            ) : (
              <p>
                To Stake {farm.asset} to the Based Loans, you need to enable it
                first.
              </p>
            )}
            <div className="flex justify-end">
              <Button
                disabled={allowed && (amount <= 0 || amount > maxBalance)}
              >
                {type === 'stake'
                  ? `${allowed ? 'Stake' : 'Enable'}`
                  : 'Unstake'}
              </Button>
            </div>
            <div className={`${styles.balance} flex justify-between`}>
              <span>Wallet Balance</span>
              <span>
                {type === 'stake' ? farm.balance || 0 : farm.stakedBalance || 0}{' '}
                {farm.asset}
              </span>
            </div>
          </form>
        )
      )}
    </Modal>
  )
}
