import { useEffect, useState } from 'react'
import styles from './Slider.module.css'

interface ISlider {
  value: boolean
  onChange?: Function
}

export default function Slider({ value, onChange }: ISlider) {
  const [checked, setChecked] = useState(false)
  const handleCheck = (e) => {
    e.stopPropagation()
    onChange && onChange()
  }

  useEffect(() => {
    setChecked(value)
  }, [value])

  return (
    <div
      className={`${styles.slider} ${checked ? styles.checked : ''}`}
      onClick={handleCheck}
    >
      <span className={styles.bar}>
        <i className={styles.dot} />
        <i className={styles.dot} />
        <i className={styles.dot} />
      </span>
    </div>
  )
}
