import { HttpLink, from, split } from '@apollo/client'

export const basedLoans = from([
  new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/based-loans/based-loans',
    // shouldBatch: true,
  }),
])

export const basedLoansRinkeby = from([
  new HttpLink({
    uri:
      'https://api.thegraph.com/subgraphs/name/based-loans/rinkeby-based-loans',
    // shouldBatch: true,
  }),
])

export default split(
  (operation) => {
    return operation.getContext().clientName == 'basedLoans'
  },
  basedLoans,
  basedLoansRinkeby
)
