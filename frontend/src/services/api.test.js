import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getApiBaseUrl } from './api.js';

describe('Frontend API URL Normalization', () => {
  test('defaults to /api when input is missing or empty', () => {
    assert.equal(getApiBaseUrl(), '/api');
    assert.equal(getApiBaseUrl(''), '/api');
    assert.equal(getApiBaseUrl('   '), '/api');
    assert.equal(getApiBaseUrl(null), '/api');
    assert.equal(getApiBaseUrl(undefined), '/api');
  });

  test('preserves relative /api path', () => {
    assert.equal(getApiBaseUrl('/api'), '/api');
    assert.equal(getApiBaseUrl('/api/'), '/api');
    assert.equal(getApiBaseUrl('/api///'), '/api');
  });

  test('appends /api to domain when absent', () => {
    assert.equal(
      getApiBaseUrl('https://securecipher-backend.onrender.com'),
      'https://securecipher-backend.onrender.com/api'
    );
    assert.equal(
      getApiBaseUrl('https://securecipher-backend.onrender.com/'),
      'https://securecipher-backend.onrender.com/api'
    );
    assert.equal(
      getApiBaseUrl('https://securecipher-backend.onrender.com///'),
      'https://securecipher-backend.onrender.com/api'
    );
  });

  test('does not duplicate /api when domain already includes it', () => {
    assert.equal(
      getApiBaseUrl('https://securecipher-backend.onrender.com/api'),
      'https://securecipher-backend.onrender.com/api'
    );
    assert.equal(
      getApiBaseUrl('https://securecipher-backend.onrender.com/api/'),
      'https://securecipher-backend.onrender.com/api'
    );
    assert.equal(
      getApiBaseUrl('https://securecipher-backend.onrender.com/api///'),
      'https://securecipher-backend.onrender.com/api'
    );
  });

  test('handles localhost and port variations', () => {
    assert.equal(getApiBaseUrl('http://127.0.0.1:8000'), 'http://127.0.0.1:8000/api');
    assert.equal(getApiBaseUrl('http://localhost:8000/'), 'http://localhost:8000/api');
    assert.equal(getApiBaseUrl('http://localhost:8000/api'), 'http://localhost:8000/api');
  });
});
