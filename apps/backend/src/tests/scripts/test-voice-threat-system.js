#!/usr/bin/env node

/**
 * Voice Threat Detection System Test Script
 * Tests the complete emergency response flow
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_USER_TOKEN = process.env.TEST_TOKEN || 'your-test-token-here';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function testVoiceThreatAnalysis() {
  logSection('Test 1: Voice Threat Analysis');

  try {
    // Test with simulated threat audio
    const testAudio = Buffer.from('fake-audio-data-for-testing');
    const form = new FormData();
    form.append('audio', testAudio, {
      filename: 'test-audio.wav',
      contentType: 'audio/wav',
    });

    log('Sending voice analysis request...', 'cyan');
    const response = await axios.post(`${API_BASE_URL}/voice-threat/analyze`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${TEST_USER_TOKEN}`,
      },
    });

    log('✓ Voice analysis completed', 'green');
    console.log('Result:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    log('✗ Voice analysis failed', 'red');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testEmergencyTrigger(sessionId) {
  logSection('Test 2: Emergency Alert Trigger');

  try {
    log('Triggering emergency alert...', 'cyan');
    const response = await axios.post(
      `${API_BASE_URL}/voice-threat/emergency/trigger`,
      {
        sessionId,
        location: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
        },
      }
    );

    log('✓ Emergency alert triggered', 'green');
    console.log('Alert ID:', response.data.alertId);
    console.log('Countdown started:', response.data.countdownStarted);

    return response.data.alertId;
  } catch (error) {
    log('✗ Emergency trigger failed', 'red');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testSafetyConfirmation(alertId) {
  logSection('Test 3: Safety Confirmation (I am safe)');

  try {
    log('Confirming safety...', 'cyan');
    const response = await axios.post(
      `${API_BASE_URL}/voice-threat/emergency/confirm-safe`,
      { alertId },
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
        },
      }
    );

    log('✓ Safety confirmed', 'green');
    console.log('Alert cancelled:', response.data.cancelled);
    console.log('Notifications sent:', response.data.notificationsSent);

    return response.data;
  } catch (error) {
    log('✗ Safety confirmation failed', 'red');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testEmergencyStatus(alertId) {
  logSection('Test 4: Emergency Status Check');

  try {
    log('Checking emergency status...', 'cyan');
    const response = await axios.get(`${API_BASE_URL}/voice-threat/emergency/status/${alertId}`, {
      headers: {
        Authorization: `Bearer ${TEST_USER_TOKEN}`,
      },
    });

    log('✓ Status retrieved', 'green');
    console.log('Status:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    log('✗ Status check failed', 'red');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testEmergencyContacts() {
  logSection('Test 5: Emergency Contacts Management');

  try {
    // Add emergency contact
    log('Adding emergency contact...', 'cyan');
    const addResponse = await axios.post(
      `${API_BASE_URL}/voice-threat/emergency/contacts`,
      {
        name: 'Test Contact',
        phoneNumber: '+1234567890',
        relationship: 'Friend',
      },
      {
        headers: {
          Authorization: `Bearer ${TEST_USER_TOKEN}`,
        },
      }
    );

    log('✓ Contact added', 'green');
    console.log('Contact ID:', addResponse.data.contactId);

    // Get all contacts
    log('Retrieving all contacts...', 'cyan');
    const getResponse = await axios.get(`${API_BASE_URL}/voice-threat/emergency/contacts`, {
      headers: {
        Authorization: `Bearer ${TEST_USER_TOKEN}`,
      },
    });

    log('✓ Contacts retrieved', 'green');
    console.log('Total contacts:', getResponse.data.contacts.length);

    return getResponse.data.contacts;
  } catch (error) {
    log('✗ Contact management failed', 'red');
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testFullEmergencyFlow() {
  logSection('Test 6: Complete Emergency Flow (2-minute countdown)');

  try {
    // Step 1: Analyze voice for threat
    log('Step 1: Analyzing voice for threat...', 'cyan');
    const analysis = await testVoiceThreatAnalysis();
    if (!analysis || !analysis.sessionId) {
      throw new Error('Voice analysis failed');
    }

    // Step 2: Trigger emergency if threat detected
    if (analysis.isThreat) {
      log('Step 2: Threat detected! Triggering emergency...', 'yellow');
      const alertId = await testEmergencyTrigger(analysis.sessionId);
      if (!alertId) {
        throw new Error('Emergency trigger failed');
      }

      // Step 3: Wait 10 seconds (simulating user decision time)
      log('Step 3: Waiting 10 seconds (simulating countdown)...', 'cyan');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Step 4: Check status
      log('Step 4: Checking emergency status...', 'cyan');
      await testEmergencyStatus(alertId);

      // Step 5: User confirms safety
      log('Step 5: User confirms safety (I am safe)...', 'cyan');
      await testSafetyConfirmation(alertId);

      log('✓ Complete emergency flow tested successfully', 'green');
    } else {
      log('No threat detected in test audio', 'yellow');
    }
  } catch (error) {
    log('✗ Emergency flow test failed', 'red');
    console.error('Error:', error.message);
  }
}

async function runAllTests() {
  console.clear();
  log('Voice Threat Detection System - Test Suite', 'bright');
  log('============================================\n', 'bright');

  log('Configuration:', 'cyan');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Test Token:', TEST_USER_TOKEN ? '✓ Set' : '✗ Not set');
  console.log('');

  if (!TEST_USER_TOKEN || TEST_USER_TOKEN === 'your-test-token-here') {
    log('⚠ Warning: Please set TEST_TOKEN environment variable', 'yellow');
    log('Usage: TEST_TOKEN=your-token node test-voice-threat-system.js\n', 'yellow');
  }

  try {
    // Run individual tests
    await testVoiceThreatAnalysis();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await testEmergencyContacts();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Run complete flow test
    await testFullEmergencyFlow();

    logSection('Test Suite Complete');
    log('✓ All tests completed', 'green');
  } catch (error) {
    log('✗ Test suite failed', 'red');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testVoiceThreatAnalysis,
  testEmergencyTrigger,
  testSafetyConfirmation,
  testEmergencyStatus,
  testEmergencyContacts,
  testFullEmergencyFlow,
};
