import Button from 'components/Button/Button'
import TxLoader from 'components/TxLoader/TxLoader'
import Modal from './Modal'
import styles from './Modal.module.css'

interface ICollateralModal {
  network?: number
  pending: boolean
  market: any
  disabled: string
  onSubmit: Function
  onClose: Function
  closeOnEscape?: boolean
}

export default function CollateralModal({
  network,
  pending,
  market,
  disabled,
  onSubmit,
  onClose,
  closeOnEscape,
}: ICollateralModal) {
  const isEnable = market && market.assetIn
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Modal
      show={!!market}
      title={`${isEnable ? 'Disable' : 'Enable'} as collateral`}
      onRequestClose={onClose}
      closeOnEscape={closeOnEscape}
      loading={pending}
    >
      {pending ? (
        <TxLoader hash={pending ? disabled : ''} network={network} />
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <p>
            Each asset used as collateral increases your borrowing limit. Be
            careful, this can subject the asset to being seized in liquidation.
          </p>
          <div className="flex justify-end">
            <Button disabled={disabled}>
              {isEnable ? 'Exit Market' : 'Enter Market'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
