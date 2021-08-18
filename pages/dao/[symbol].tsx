import { PublicKey } from '@solana/web3.js'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useMemo } from 'react'
import { useEffect } from 'react'
import { RealmInfo } from '../../@types/types'
import useWalletStore from '../../stores/useWalletStore'
import moment from 'moment'

export const REALMS: RealmInfo[] = [
  {
    symbol: 'MNGO',
    programId: new PublicKey('GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J'),
    realmId: new PublicKey('DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE'),
  },
]

export const ProposalStateLabels = {
  0: 'Draft',
  1: 'Draft',
  2: 'Active',
  3: 'Approved',
  4: 'Approved',
  5: 'Approved',
  6: 'Cancelled',
  7: 'Denied',
  8: 'Error',
}

const DAO = () => {
  const router = useRouter()
  const { symbol } = router.query

  const { fetchRealm } = useWalletStore((s) => s.actions)
  const connected = useWalletStore((s) => s.connected)
  const wallet = useWalletStore((s) => s.current)
  const realms = useWalletStore((s) => s.realms)
  const governances = useWalletStore((s) => s.governances)
  const proposals = useWalletStore((s) => s.proposals)
  const votes = useWalletStore((s) => s.votes)
  const tokenAccounts = useWalletStore((s) => s.tokenAccounts)
  const tokenRecords = useWalletStore((s) => s.tokenRecords)

  const realmInfo = useMemo(() => REALMS.find((r) => r.symbol === symbol), [
    symbol,
  ])

  useEffect(() => {
    if (realmInfo) {
      fetchRealm(realmInfo.programId, realmInfo.realmId)
    }
  }, [realmInfo])

  const realm = useMemo(() => {
    return realmInfo && realms[realmInfo.realmId.toBase58()]
  }, [realmInfo, realms])

  const realmGovernances = useMemo(() => {
    return realmInfo
      ? Object.fromEntries(
          Object.entries(governances).filter(([_k, v]) =>
            v.info.realm.equals(realmInfo.realmId)
          )
        )
      : {}
  }, [realmInfo, governances])

  const realmProposals = useMemo(() => {
    return Object.fromEntries(
      Object.entries(proposals)
        .filter(
          ([_k, v]) =>
            Object.keys(realmGovernances).includes(
              v.info.governance.toBase58()
            ) && v.info.votingAtSlot
        )
        .sort(
          (a, b) =>
            b[1].info.votingAt.toNumber() - a[1].info.votingAt.toNumber()
        )
    )
  }, [realmGovernances, proposals])

  const realmTokenAccount = useMemo(
    () =>
      realm &&
      tokenAccounts.find((a) =>
        a.account.mint.equals(realm.info.communityMint)
      ),
    [realm, tokenAccounts]
  )

  console.log(
    'governance page tokenAccounts',
    tokenAccounts,
    realmTokenAccount && realmTokenAccount.publicKey.toBase58()
  )

  console.log(
    'governance page wallet',
    wallet?.connected && wallet.publicKey.toBase58()
  )

  const realmTokenRecord = useMemo(
    () => wallet?.connected && tokenRecords[wallet.publicKey.toBase58()],
    [tokenRecords, wallet, connected]
  )

  console.log(
    'governance page tokenRecord',
    wallet?.connected && realmTokenRecord
  )

  return (
    <>
      <div className="m-10">
        <h1>{symbol}</h1>
        <p>
          in Wallet:{' '}
          {realmTokenAccount
            ? realmTokenAccount.account.amount.toString()
            : 'N/A'}
        </p>
        <p>
          in Governance:{' '}
          {realmTokenRecord
            ? realmTokenRecord.info.governingTokenDepositAmount.toNumber()
            : 'N/A'}
        </p>
        <p>Proposals:</p>
        {Object.entries(realmProposals).map(([k, v]) => (
          <div className="m-10 p-4 border" key={k}>
            <Link href={`/proposal/${k}`}>
              <a>
                <h3>{v.info.name}</h3>
                <p>{v.info.descriptionLink}</p>
                <p>
                  {moment.unix(v.info.votingCompletedAt.toNumber()).fromNow()}
                </p>
                <p>{ProposalStateLabels[v.info.state]}</p>
                <p>Votes {JSON.stringify(votes[k])}</p>
                <p>
                  {`Yes Threshold: ${
                    governances[v.info.governance.toBase58()]?.info.config
                      .voteThresholdPercentage.value
                  }%`}
                </p>
              </a>
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}

export default DAO
