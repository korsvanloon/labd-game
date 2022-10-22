import { Head, Html, Main, NextScript } from 'next/document'

const locale = 'en-US'
const MyDocument = () => {
  return (
    <Html lang={locale}>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600&family=Markazi+Text:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default MyDocument
