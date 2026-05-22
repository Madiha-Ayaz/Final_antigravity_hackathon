import jwt from 'jsonwebtoken';
import axios from 'axios';
import { config } from '@silentsiren/config';
import { databaseService } from '../../services/database.service';
import { userRepository } from '../../repositories/user.repository';

async function triggerEmergency() {
  console.log('Connecting to database...');
  await databaseService.connect();

  console.log('Fetching demo user from database...');
  let userId: string;
  try {
    const userRes = await databaseService.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      console.log('Found existing user in database with ID:', userId);
    } else {
      console.log('No users found in database, creating a demo user...');
      const demoUser = await userRepository.create({
        phone_number: '+15550199',
        email: 'demo.user@silentsiren.ai',
        full_name: 'Antigravity Demo User',
        password: 'password123',
        device_fingerprint: 'demo-device-fingerprint',
      });
      userId = demoUser.id;
      console.log('Demo user successfully created with ID:', userId);
    }
  } catch (dbErr: any) {
    console.error('Failed to query or create user in database:', dbErr.message);
    process.exit(1);
  }

  console.log('Generating JWT Token for userId:', userId);
  const token = jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: '1h' });
  console.log('JWT Token successfully generated!');

  const payload = {
    eventType: 'VOICE_TRIGGER',
    latitude: 31.5204,
    longitude: 74.3587,
    address: 'Lahore, Pakistan',
    transcript: 'Help me, there is a fire here!',
    aiConfidence: 0.95,
    aiReasoning: 'Distress detected',
    detectedPatterns: ['fire', 'panic'],
    emotionalStress: 0.9,
    threatLevel: 'CRITICAL',
  };

  console.log('Sending emergency trigger POST request to backend...');
  try {
    const response = await axios.post('http://localhost:3001/api/emergency/trigger', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Trigger Request Succeeded! Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('Trigger Request Failed! Error:', error.message);
    if (error.response) {
      console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    console.log('Disconnecting database...');
    await databaseService.disconnect();
  }
}

triggerEmergency();
