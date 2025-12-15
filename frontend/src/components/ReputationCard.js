import React, { useEffect, useState } from 'react';
import { Card, Button, Form, ListGroup, Badge } from 'react-bootstrap';
import { useBlockchain } from '../utils/BlockchainContext';
import { getSellerScore, getReputation } from '../utils/blockchain-clean';

// Local feedback storage helpers
const storageKey = (seller) => `ft_feedback_${seller.toLowerCase()}`;

export const getLocalFeedbacks = (seller) => {
  if (!seller) return [];
  try {
    const raw = localStorage.getItem(storageKey(seller));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read local feedbacks', e);
    return [];
  }
};

export const saveLocalFeedback = (seller, feedback) => {
  if (!seller) return;
  try {
    const list = getLocalFeedbacks(seller);
    list.unshift(feedback); // newest first
    localStorage.setItem(storageKey(seller), JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save local feedback', e);
  }
};

export const getLocalAverageRating = (seller) => {
  const list = getLocalFeedbacks(seller);
  if (!list.length) return null;
  const sum = list.reduce((s, r) => s + (r.rating || 0), 0);
  return sum / list.length;
};

const ReputationCard = ({ sellerAddress }) => {
  const { contract, account } = useBlockchain();
  const [onChainRep, setOnChainRep] = useState(null);
  const [onChainScore, setOnChainScore] = useState(null);
  const [localAvg, setLocalAvg] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!sellerAddress) return;
      // load on-chain reputation/score
      try {
        const rep = await getReputation(contract, sellerAddress);
        setOnChainRep(rep);
        const score = await getSellerScore(contract, sellerAddress);
        setOnChainScore(score);
      } catch (e) {
        console.warn('Could not load on-chain reputation', e);
      }

      // load local feedbacks
      const localList = getLocalFeedbacks(sellerAddress);
      setFeedbacks(localList);
      const avg = getLocalAverageRating(sellerAddress);
      setLocalAvg(avg);
    };

    load();
  }, [sellerAddress, contract]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sellerAddress) return;
    const fb = {
      from: account || 'anonymous',
      rating: Number(rating),
      comment: comment || '',
      timestamp: Date.now()
    };
    saveLocalFeedback(sellerAddress, fb);
    const updated = getLocalFeedbacks(sellerAddress);
    setFeedbacks(updated);
    setLocalAvg(getLocalAverageRating(sellerAddress));
    setComment('');
  };

  const compositeScore = () => {
    // combine on-chain (70%) and local (30%) into 0-100
    const onchain = onChainScore !== null && onChainScore !== undefined ? onChainScore : null;
    const localScaled = localAvg !== null && localAvg !== undefined ? (localAvg / 5) * 100 : null;
    if (onchain === null && localScaled === null) return null;
    if (onchain === null) return Math.round(localScaled);
    if (localScaled === null) return Math.round(onchain);
    return Math.round(onchain * 0.7 + localScaled * 0.3);
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h6 className="mb-0">Seller Reputation</h6>
      </Card.Header>
      <Card.Body>
        <p><strong>Seller:</strong> <code>{sellerAddress}</code></p>

        <p>
          <strong>On-chain Reputation:</strong>{' '}
          {onChainRep === null ? (
            <small className="text-muted">—</small>
          ) : (
            <Badge bg={onChainScore >= 75 ? 'success' : onChainScore >= 40 ? 'warning' : 'secondary'}>
              {onChainScore}/100
            </Badge>
          )}
        </p>

        <p>
          <strong>Local Reviews (buyers):</strong>{' '}
          {localAvg === null ? (
            <small className="text-muted">No reviews</small>
          ) : (
            <Badge bg={localAvg >= 4 ? 'success' : localAvg >= 2.5 ? 'warning' : 'secondary'}>
              {localAvg.toFixed(2)} / 5
            </Badge>
          )}
        </p>

        <p>
          <strong>Composite Score:</strong>{' '}
          {compositeScore() === null ? (
            <small className="text-muted">—</small>
          ) : (
            <Badge bg={compositeScore() >= 75 ? 'success' : compositeScore() >= 40 ? 'warning' : 'secondary'}>
              {compositeScore()}/100
            </Badge>
          )}
        </p>

        <hr />

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-2">
            <Form.Label>Rate this seller</Form.Label>
            <div>
              {[1,2,3,4,5].map((s) => (
                <Button
                  key={s}
                  variant={s <= rating ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="me-1"
                  onClick={() => setRating(s)}
                >
                  {s}★
                </Button>
              ))}
            </div>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Comment (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Form.Group>
          <div className="d-grid">
            <Button type="submit" variant="success">Submit Feedback</Button>
          </div>
        </Form>

        {feedbacks.length > 0 && (
          <>
            <hr />
            <h6>Recent Reviews</h6>
            <ListGroup variant="flush">
              {feedbacks.slice(0,5).map((fb, idx) => (
                <ListGroup.Item key={idx}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{fb.rating}★</strong> <small className="text-muted">by {fb.from}</small>
                      <div>{fb.comment && <small className="d-block text-muted">"{fb.comment}"</small>}</div>
                    </div>
                    <div>
                      <small className="text-muted">{new Date(fb.timestamp).toLocaleString()}</small>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ReputationCard;
