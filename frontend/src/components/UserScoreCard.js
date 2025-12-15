import React, { useEffect, useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useBlockchain } from '../utils/BlockchainContext';
import { getSellerScore } from '../utils/blockchain-clean';

const UserScoreCard = ({ address }) => {
  const { contract, account } = useBlockchain();
  const [score, setScore] = useState(null);

  useEffect(() => {
    const load = async () => {
      const target = address || account;
      if (!target || !contract) return;
      try {
        const s = await getSellerScore(contract, target);
        setScore(s);
      } catch (e) {
        console.warn('Failed to load user score', e);
      }
    };
    load();
  }, [address, account, contract]);

  return (
    <Card className="mb-4">
      <Card.Body>
        <h6 className="mb-2">User Score</h6>
        {score === null ? (
          <small className="text-muted">Not available</small>
        ) : (
          <Badge bg={score >= 75 ? 'success' : score >= 40 ? 'warning' : 'secondary'}>
            {score}/100
          </Badge>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserScoreCard;
