<?php
declare(strict_types=1);
date_default_timezone_set('Asia/Bangkok');
function configuration(): array {
 static $config;
 if (!$config) {
  $path = __DIR__.'/config.php';
  if (!is_file($path)) throw new RuntimeException('Server is not configured');
  $config = require $path;
 }
 return $config;
}
function db(): PDO {
 static $pdo;
 if (!$pdo) {
  $c=configuration();
  $pdo=new PDO('mysql:host='.$c['db_host'].';port='.$c['db_port'].';dbname='.$c['db_name'].';charset=utf8mb4',$c['db_user'],$c['db_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
  $pdo->exec("SET time_zone = '+07:00'");
 }
 return $pdo;
}
function query(string $sql,array $values=[]): PDOStatement { $s=db()->prepare($sql);$s->execute($values);return $s; }
function fail(string $message,int $status=400): never { http_response_code($status);echo json_encode(['error'=>$message],JSON_UNESCAPED_UNICODE);exit; }
function result(mixed $data): never { echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit; }
function input(): array { $raw=file_get_contents('php://input');$d=json_decode($raw,true);if(!is_array($d))fail('ข้อมูลไม่ถูกต้อง');return $d; }
function currentUser(bool $required=true): ?array {
 $u=isset($_SESSION['uid']) ? query('SELECT id,name,email,phone,role FROM users WHERE id=?',[$_SESSION['uid']])->fetch() : false;
 if(!$u && $required)fail('กรุณาเข้าสู่ระบบ',401);
 return $u ?: null;
}
function admin(): array { $u=currentUser();if($u['role']!=='admin')fail('เฉพาะผู้ดูแลสนาม',403);return $u; }
function textValue(mixed $v,int $max=500): string { if(!is_string($v) || mb_strlen(trim($v))>$max)fail('กรุณาตรวจสอบข้อมูล');return trim($v); }
function audit(int $actor,?int $booking,string $action,string $details=''): void { query('INSERT INTO audit_logs(actor_id,booking_id,action,details) VALUES (?,?,?,?)',[$actor,$booking,$action,$details]); }
function expireBookings(): void {
 query("UPDATE bookings SET status='expired' WHERE status='pending_payment' AND expires_at <= NOW()");
 query("UPDATE bookings SET status='completed',completed_at=NOW() WHERE status IN ('confirmed','checked_in') AND TIMESTAMP(booking_date,MAKETIME(end_hour,0,0))<=NOW()");
}
function rateLimit(string $key,int $max): void {
 $key=hash('sha256',$key);
 query('INSERT INTO rate_limits(key_hash,attempts,reset_at) VALUES (?,1,DATE_ADD(NOW(),INTERVAL 15 MINUTE)) ON DUPLICATE KEY UPDATE attempts=IF(reset_at<NOW(),1,attempts+1),reset_at=IF(reset_at<NOW(),DATE_ADD(NOW(),INTERVAL 15 MINUTE),reset_at)',[$key]);
 if((int)query('SELECT attempts FROM rate_limits WHERE key_hash=?',[$key])->fetchColumn()>$max)fail('ลองใหม่อีกครั้งใน 15 นาที',429);
}
function imageUpload(string $key): array {
 $f=$_FILES[$key]??null;
 if(!$f || $f['error']!==UPLOAD_ERR_OK || $f['size']>5*1024*1024 || $f['size']<1)fail('เลือกรูป JPG, PNG หรือ WebP ไม่เกิน 5 MB');
 $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
 $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime]??null;
 if(!$ext || !getimagesize($f['tmp_name']))fail('รองรับเฉพาะรูป JPG, PNG และ WebP');
 $dir=configuration()['storage_dir'];if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Storage unavailable');
 $name=bin2hex(random_bytes(24)).'.'.$ext;
 $hash=hash_file('sha256',$f['tmp_name']);
 if(!move_uploaded_file($f['tmp_name'],$dir.'/'.$name))throw new RuntimeException('Upload failed');
 return [$name,$mime,$hash];
}
function bookingForUser(string $code,array $u): array {
 $b=query('SELECT b.*,u.name,u.phone,u.email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.code=?',[$code])->fetch();
 if(!$b || ($u['role']!=='admin' && (int)$b['user_id']!==(int)$u['id']))fail('ไม่พบรายการ',404);
 return $b;
}
function publicBooking(array $b): array {
 $b['has_slip']=!empty($b['slip_file']);
 unset($b['slip_file'],$b['slip_mime'],$b['slip_hash']);
 if(!in_array($b['status'],['confirmed','checked_in','completed'],true))$b['ticket_token']=null;
 return $b;
}
