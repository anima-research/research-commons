#!/usr/bin/env node

/**
 * Create an admin user (for initial setup)
 */

import { UserStore } from './src/services/user-store.js';
import * as readline from 'readline';

const DATA_PATH = process.env.DATA_PATH || './data';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🔧 Create Admin User\n');
  
  const userStore = new UserStore(DATA_PATH);
  await userStore.init();

  const email = await question('Admin email: ');
  const password = await question('Admin password: ');
  const name = await question('Admin name: ');

  if (!email || !password || !name) {
    console.error('❌ All fields required');
    process.exit(1);
  }

  try {
    const user = await userStore.createUser(email, password, name);
    
    // Add admin role
    await userStore.addUserRole(user.id, 'admin');
    await userStore.addUserRole(user.id, 'researcher');
    
    console.log('\n✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Roles: admin, researcher');
  } catch (err: any) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }

  await userStore.close();
  rl.close();
}

main().catch(console.error);

