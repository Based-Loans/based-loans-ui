import BigNumber from 'bignumber.js'
import Button from 'components/Button/Button'
import TxLoader from 'components/TxLoader/TxLoader'
import Modal from './Modal'
import styles from './Modal.module.css'

interface IBloModal {
  isOpen: boolean
  pending: boolean
  network?: number
  balance: number
  rewardBalance: number
  price: number
  disabled: string
  onSubmit: Function
  onClose: Function
  closeOnEscape?: boolean
}

export default function BloModal({
  isOpen,
  pending,
  network,
  balance,
  rewardBalance,
  price,
  disabled,
  onSubmit,
  onClose,
  closeOnEscape,
}: IBloModal) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ amount: rewardBalance })
  }

  return (
    <Modal
      show={!!isOpen}
      title="BLO Balance"
      onRequestClose={onClose}
      closeOnEscape={closeOnEscape}
      loading={pending}
    >
      {pending ? (
        <TxLoader hash={pending ? disabled : ''} network={network} />
      ) : (
        <>
          {isOpen && (
            <div className={styles.form}>
              <div className={`${styles.info} flex justify-between`}>
                <div className="flex-center">
                  <img src="/assets/token.png" alt="asset" />
                  <span>BLO Balance</span>
                </div>
                <div>
                  <p className="text-right">
                    {new BigNumber(rewardBalance).dp(4, 1).toString(10)}
                  </p>
                  <p className="text-right">
                    $
                    {new BigNumber(rewardBalance)
                      .times(price)
                      .dp(2, 1)
                      .toString(10)}
                  </p>
                </div>
              </div>
              <div className={`${styles.info} flex justify-between`}>
                <div className="flex-center">
                  <span>Wallet Balance</span>
                </div>
                <span>{new BigNumber(balance).dp(4, 1).toString(10)}</span>
              </div>
              <div className={`${styles.info} flex justify-between`}>
                <div className="flex-center">
                  <span>Unclaimed Balance</span>
                </div>
                <span>
                  {new BigNumber(rewardBalance).dp(4, 1).toString(10)}
                </span>
              </div>
              <div className={`${styles.info} flex justify-between`}>
                <div className="flex-center">
                  <span>Price</span>
                </div>
                <span>${new BigNumber(price).dp(2, 1).toString(10)}</span>
              </div>
              <div className={`flex justify-end ${styles.claimBtn}`}>
                <Button onClick={handleSubmit} disabled={rewardBalance === 0}>
                  CLAIM {new BigNumber(rewardBalance).dp(4, 1).toString(10)} BLO
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
