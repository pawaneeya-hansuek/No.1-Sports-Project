<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/server/bootstrap.php';
// All fixtures and automatic status changes are rolled back, including on failure.
function check(bool $condition, string $message): void {
 if (!$condition) throw new RuntimeException($message);
 echo "PASS: $message\n";
}
try {
 db()->beginTransaction();
 query("INSERT INTO users(name,password_hash) VALUES ('transaction test','unused')");
 $user=(int)db()->lastInsertId();
 query("INSERT INTO fields(name,description,price) VALUES ('transaction test','',800)");
 $field=(int)db()->lastInsertId();
 $ids=[];
 foreach (['pending_payment','review','confirmed','checked_in'] as $status) {
  query("INSERT INTO bookings(code,user_id,field_id,field_name,booking_date,start_hour,end_hour,amount,status,expires_at) VALUES (?,?,?,'transaction test',DATE_SUB(CURDATE(),INTERVAL 1 DAY),9,10,800,?,DATE_SUB(NOW(),INTERVAL 1 MINUTE))",['TEST-'.bin2hex(random_bytes(8)),$user,$field,$status]);
  $ids[$status]=(int)db()->lastInsertId();
 }
 expireBookings();
 foreach (['pending_payment'=>'expired','review'=>'review','confirmed'=>'completed','checked_in'=>'completed'] as $before=>$after) {
  check(query('SELECT status FROM bookings WHERE id=?',[$ids[$before]])->fetchColumn()===$after, "$before becomes $after");
 }
 check((bool)query('SELECT completed_at FROM bookings WHERE id=?',[$ids['confirmed']])->fetchColumn(), 'Unattended paid booking retains a completion timestamp');
 $b=query('SELECT * FROM bookings WHERE id=?',[$ids['review']])->fetch();
 $b['ticket_token']='private-token';
 check(publicBooking($b)['ticket_token']===null, 'Payment awaiting review cannot expose an admission ticket');
 expireBookings();
 check(query('SELECT status FROM bookings WHERE id=?',[$ids['review']])->fetchColumn()==='review', 'Repeated maintenance preserves submitted payments for manual review');
} finally {
 if (db()->inTransaction()) db()->rollBack();
}
