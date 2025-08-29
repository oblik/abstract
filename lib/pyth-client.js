// This module provides a safe way to import @pythnetwork/client
// It's designed to be imported only on the server side

let pythClient;

if (typeof window === 'undefined') {
  // Server-side only
  try {
    pythClient = require('@pythnetwork/client');
  } catch (error) {
    console.error('Failed to load @pythnetwork/client:', error);
    pythClient = null;
  }
} else {
  // Browser side - provide empty implementation
  pythClient = {
    parsePriceData: () => {
      throw new Error('@pythnetwork/client is not available in the browser');
    }
  };
}

module.exports = pythClient;