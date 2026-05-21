#!/usr/bin/env node

/**
 * Test Emergency Contacts & Firebase Sync
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-firebase-token-here';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function testAddContact() {
  logSection('Test 1: Add Emergency Contact');

  try {
    log('Adding emergency contact...', 'cyan');

    const response = await axios.post(
      `${API_BASE_URL}/emergency-contacts/add`,
      {
        name: 'Test Contact',
        phoneNumber: '923001234567',
        relationship: 'Family',
        carrier: 'jazz',
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    log('✓ Contact added successfully', 'green');
    console.log('Contact ID:', response.data.contact.id);
    console.log('Name:', response.data.contact.name);
    console.log('Phone:', response.data.contact.phoneNumber);
    console.log('Carrier:', response.data.contact.carrier);

    return response.data.contact.id;
  } catch (error) {
    log('✗ Failed to add contact', 'red');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetContacts() {
  logSection('Test 2: Get All Contacts');

  try {
    log('Fetching contacts...', 'cyan');

    const response = await axios.get(`${API_BASE_URL}/emergency-contacts/list`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    log('✓ Contacts retrieved', 'green');
    console.log('Total contacts:', response.data.count);
    console.log('Contacts:', JSON.stringify(response.data.contacts, null, 2));

    return response.data.contacts;
  } catch (error) {
    log('✗ Failed to get contacts', 'red');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testDeleteContact(contactId) {
  logSection('Test 3: Delete Contact');

  try {
    log(`Deleting contact ${contactId}...`, 'cyan');

    const response = await axios.delete(`${API_BASE_URL}/emergency-contacts/${contactId}`, {
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
    });

    log('✓ Contact deleted', 'green');
    console.log('Message:', response.data.message);

    return true;
  } catch (error) {
    log('✗ Failed to delete contact', 'red');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log('Emergency Contacts & Firebase Sync - Test Suite', 'bright');
  log('=================================================\n', 'bright');

  log('Configuration:', 'cyan');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Test Token:', TEST_TOKEN ? '✓ Set' : '✗ Not set');
  console.log('');

  if (!TEST_TOKEN || TEST_TOKEN === 'your-firebase-token-here') {
    log('⚠ Warning: Please set TEST_TOKEN environment variable', 'yellow');
    log('Usage: TEST_TOKEN=your-firebase-token node test-contacts.js\n', 'yellow');
    return;
  }

  try {
    // Test 1: Add contact
    const contactId = await testAddContact();
    await delay(2000);

    // Test 2: Get contacts
    await testGetContacts();
    await delay(2000);

    // Test 3: Delete contact (if created)
    if (contactId) {
      await testDeleteContact(contactId);
    }

    logSection('Test Suite Complete');
    log('✓ All tests completed', 'green');
    log('', 'reset');
    log('Next Steps:', 'cyan');
    console.log('1. Check Neon database for synced data');
    console.log('2. Verify Firebase users are synced');
    console.log('3. Test from frontend UI');
  } catch (error) {
    log('✗ Test suite failed', 'red');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testAddContact,
  testGetContacts,
  testDeleteContact,
};
