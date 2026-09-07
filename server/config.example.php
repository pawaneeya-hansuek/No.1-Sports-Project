<?php
// Copy to config.php OUTSIDE public/. Never commit real credentials.
return [
 'db_host' => '127.0.0.1',
 'db_port' => 3306,
 'db_name' => 'no1_sports',
 'db_user' => 'no1_app',
 'db_password' => 'CHANGE_ME',
 'secure_cookies' => true, // false ONLY for local HTTP development
 'storage_dir' => __DIR__ . '/storage',
];
