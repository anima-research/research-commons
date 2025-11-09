#!/bin/bash
# Quick admin promotion script
echo "Enter your email address:"
read EMAIL
railway run "sqlite3 /app/data/research.db \"INSERT INTO user_roles (user_id, role) SELECT id, 'admin' FROM users WHERE email = '$EMAIL' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = users.id AND role = 'admin'); INSERT INTO user_roles (user_id, role) SELECT id, 'researcher' FROM users WHERE email = '$EMAIL' AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = users.id AND role = 'researcher'); SELECT 'Added admin+researcher roles to: ' || name FROM users WHERE email = '$EMAIL';\""
