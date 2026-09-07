<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/bootstrap.php';
expireBookings();
query('DELETE FROM rate_limits WHERE reset_at<DATE_SUB(NOW(),INTERVAL 1 DAY)');
echo "Maintenance complete\n";
