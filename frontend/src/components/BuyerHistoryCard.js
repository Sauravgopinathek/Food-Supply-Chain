import React, { useState, useEffect } from 'react';
import { Card, Button, Form, ListGroup } from 'react-bootstrap';
import { useBlockchain } from '../utils/BlockchainContext';
import { getBuyerHistory, addBuyerEntry, clearBuyerHistory } from '../utils/buyer-history';

const BuyerHistoryCard = ({ batchId }) => {
  const { account } = useBlockchain();
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!batchId) return;
    setEntries(getBuyerHistory(batchId));
  }, [batchId]);

  const handleAdd = (e) => {
    e.preventDefault();
    const entry = {
      address: account || 'anonymous',
      name: name || '',
      note: note || '',
      timestamp: Date.now()
    };
    const updated = addBuyerEntry(batchId, entry);
    setEntries(updated);
    setName('');
    setNote('');
  };

  const handleClear = () => {
    clearBuyerHistory(batchId);
    setEntries([]);
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h6 className="mb-0">Buyer History</h6>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleAdd}>
          <Form.Group className="mb-2">
            <Form.Label>Buyer name (optional)</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Note (optional)</Form.Label>
            <Form.Control value={note} onChange={(e) => setNote(e.target.value)} />
          </Form.Group>
          <div className="d-grid gap-2">
            <Button type="submit" variant="primary">Add Buyer Entry</Button>
            <Button variant="outline-danger" onClick={handleClear}>Clear History</Button>
          </div>
        </Form>

        {entries.length > 0 && (
          <>
            <hr />
            <ListGroup variant="flush">
              {entries.map((e, idx) => (
                <ListGroup.Item key={idx}>
                  <div className="d-flex justify-content-between">
                    <div>
                      <strong>{e.name || e.address}</strong>
                      <div className="text-muted small">{e.address}</div>
                      {e.note && <div className="mt-1">{e.note}</div>}
                    </div>
                    <div className="text-muted small">{new Date(e.timestamp).toLocaleString()}</div>
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

export default BuyerHistoryCard;
