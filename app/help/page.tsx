import styles from './help.module.css'

export default function Page() {
  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <h2>Controls</h2>
        <dl>
          <dt>Minus/Plus</dt>
          <dd>Switch Avatar</dd>
          <dt>Joystick</dt>
          <dd>Move around</dd>
          <dt>Left</dt>
          <dd>Cancel/Drop, scroll left, indent code left</dd>
          <dt>Up</dt>
          <dd>scroll up</dd>
          <dt>Right</dt>
          <dd>Confirm/Pick up, scroll right, indent code right</dd>
          <dt>Down</dt>
          <dd>scroll down</dd>
        </dl>
      </div>
    </div>
  )
}
