import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { useBlockchain } from '../utils/BlockchainContext';

/**
 * BlockMonitor
 * Shows latest block number and timestamp. Subscribes to provider 'block' events.
 */
const BlockMonitor = () => {
  const { provider } = useBlockchain();
  const [blockNumber, setBlockNumber] = useState(null);
  const [blockTime, setBlockTime] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!provider) {
      setBlockNumber(null);
      setBlockTime(null);
      return;
    }

    const loadLatest = async () => {
      try {
        const net = await provider.getNetwork();
        if (!mounted) return;
        setNetwork(net);

        const bn = await provider.getBlockNumber();
        if (!mounted) return;
        setBlockNumber(bn);

        const block = await provider.getBlock(bn);
        if (!mounted) return;
        setBlockTime(block ? new Date(block.timestamp * 1000).toLocaleString() : null);
      } catch (err) {
        console.warn('BlockMonitor: failed to load latest block', err.message || err);
      }
    };

    loadLatest();

    // subscribe to block events
    const onBlock = async (bn) => {
      try {
        if (!mounted) return;
        setBlockNumber(bn);
        const block = await provider.getBlock(bn);
        if (!mounted) return;
        setBlockTime(block ? new Date(block.timestamp * 1000).toLocaleString() : null);
      } catch (err) {
        console.warn('BlockMonitor: onBlock handler error', err.message || err);
      }
    };

    try {
      provider.on && provider.on('block', onBlock);
    } catch (e) {
      console.warn('BlockMonitor: provider does not support .on', e.message || e);
    }

    return () => {
      mounted = false;
      try {
        provider.off && provider.off('block', onBlock);
      } catch (e) {
        /* ignore */
      }
    };
  }, [provider]);

  return (
    <Card className="mb-3">
      <Card.Body>
        <h6 className="mb-1">Blockchain Status</h6>
        <div>
          <strong>Network:</strong>{' '}
          {network ? `${network.name || 'chain-' + network.chainId} (${network.chainId})` : <small className="text-muted">No provider</small>}
        </div>
        <div>
          <strong>Latest block:</strong>{' '}
          {blockNumber === null ? <Spinner animation="border" size="sm" /> : blockNumber}
        </div>
        <div>
          <strong>Timestamp:</strong>{' '}
          {blockTime ? blockTime : <small className="text-muted">—</small>}
        </div>
      </Card.Body>
    </Card>
  );
};

export default BlockMonitor;
