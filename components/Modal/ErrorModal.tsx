// import { useEffect } from 'react'
import Modal from './Modal'
import styles from './Modal.module.css'

interface IErrorModal {
  errMessage: string
  onClose: Function
  closeOnEscape?: boolean
}

export default function ErrorModal({
  errMessage,
  onClose,
  closeOnEscape,
}: IErrorModal) {
  // useEffect(() => {
  //   if (errMessage) {
  //     let audio = new Audio('/assets/error.mp3');
  //     audio.play();
  //   }
  // }, [errMessage])
  
  return (
    <Modal
      show={!!errMessage}
      title="Error"
      onRequestClose={onClose}
      closeOnEscape={closeOnEscape}
    >
      <form className={styles.form}>
        <p className={styles.errMsg}>
          {errMessage}
        </p>
      </form>
    </Modal>
  )
}
