import React, { useState } from 'react';
import { Container, Card, Form, Button, ListGroup } from 'react-bootstrap';
import { useBlockchain } from '../utils/BlockchainContext';
import { getDealerReviews, addDealerReview } from '../utils/dealer-feedback';

const RateDealer = () => {
  const { account } = useBlockchain();
  const [dealerAddr, setDealerAddr] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);

  const handleLookup = () => {
    if (!dealerAddr) return;
    setReviews(getDealerReviews(dealerAddr));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dealerAddr) return;
    const rev = {
      from: account || 'anonymous',
      rating,
      comment,
      timestamp: Date.now()
    };
    const updated = addDealerReview(dealerAddr, rev);
    setReviews(updated);
    setComment('');
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header><h5>Rate a Dealer</h5></Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit} className="mb-3">
            <Form.Group className="mb-2">
              <Form.Label>Dealer Wallet Address</Form.Label>
              <Form.Control value={dealerAddr} onChange={(e) => setDealerAddr(e.target.value)} placeholder="0x..." />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Rating</Form.Label>
              <div>
                {[1,2,3,4,5].map((s) => (
                  <Button key={s} variant={s<=rating ? 'primary' : 'outline-secondary'} size="sm" className="me-1" onClick={() => setRating(s)}>{s}★</Button>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Comment</Form.Label>
              <Form.Control value={comment} onChange={(e) => setComment(e.target.value)} />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button type="submit" variant="success">Submit Review</Button>
              <Button variant="secondary" onClick={handleLookup}>Load Reviews</Button>
            </div>
          </Form>

          {reviews.length > 0 && (
            <>
              <h6>Reviews</h6>
              <ListGroup>
                {reviews.map((r, i) => (
                  <ListGroup.Item key={i}>
                    <strong>{r.rating}★</strong> <small className="text-muted">by {r.from}</small>
                    <div>{r.comment}</div>
                    <small className="text-muted">{new Date(r.timestamp).toLocaleString()}</small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default RateDealer;
