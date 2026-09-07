<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/bootstrap.php';
try {
 foreach (['users','fields','bookings','settings','audit_logs','rate_limits'] as $table) {
  query('SELECT 1 FROM '.$table.' LIMIT 1');
 }
 if (!query('SELECT id FROM settings WHERE id=1')->fetchColumn()) throw new RuntimeException('Missing settings row');
 echo "MySQL connection and required tables: OK\n";
} catch (Throwable $e) {
 fwrite(STDERR, "Database check failed. Check server/config.php and import database/schema.sql into an empty database.\n");
 exit(1);
}
