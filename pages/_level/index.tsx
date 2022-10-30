import { GetServerSideProps } from 'next'

function Web() {
  return <div />
}
export default Web

export const getServerSideProps: GetServerSideProps<{}> = async ({}) => {
  return {
    redirect: {
      permanent: false,
      destination: '/level/agradi-homepage',
    },
  }
}
