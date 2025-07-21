
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

import '@solana/wallet-adapter-react-ui/styles.css';

export default function WalletButton() {
  return (
    <div className="absolute top-0 right-0">
      <WalletMultiButton />
    </div>
  );
}