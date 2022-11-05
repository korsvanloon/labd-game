import Image from 'next/image'
import pacManImage from '../public/images/pacman2.png'
import styles from './home.module.css'

export default async function Page() {
  return (
    <div className={styles.root}>
      <Image src={pacManImage} priority alt="Pacman" width={500} />
    </div>
  )
}
