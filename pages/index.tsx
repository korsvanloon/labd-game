import { GetServerSideProps } from 'next'

type Props = {
  yearData: { [year: number]: Destination }
}

export default function Web({ yearData }: Props) {
  return (
    <div>
      <h1>Web</h1>
      <pre>{JSON.stringify(yearData, null, 2)}</pre>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  const year = Number.isInteger(Number(query.year)) ? Number(query.year) : null

  const data = await fetch(
    'http://localhost:4000/migrations' + (year ? `/year/${year}` : ''),
  ).then((r) => r.json())

  return {
    props: {
      yearData: data.data,
    },
  }
}

interface Destination {
  [destination: string]: { [origin: string]: number }
}
