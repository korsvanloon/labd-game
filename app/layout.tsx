import Link from 'next/link'
import { MainMenu } from '../components/MainMenu'
import { Players } from '../components/Players'
import buttonStyles from '../styles/Button.module.css'
import controllerButtonsStyles from '../styles/ControllerButtons.module.css'
import '../styles/global.css'
import mainMenuStyles from '../styles/MainMenu.module.css'
import playerStyles from '../styles/Player.module.css'
import styles from './layout.module.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600&family=Markazi+Text:wght@600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className={styles.root}>
          <nav>
            <Link href="/">
              <img src="/logo.svg" alt="Lab Digital" height="40" width="168" />
            </Link>
            <h1>The Game</h1>
          </nav>
          <div>
            <MainMenu
              styles={{
                mainMenu: mainMenuStyles,
                button: buttonStyles,
                controller: controllerButtonsStyles,
              }}
            />
            <main>{children}</main>
          </div>
        </div>
        <Players
          styles={{
            player: playerStyles,
            players: {},
          }}
        />
      </body>
    </html>
  )
}
