<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
try {
 $c=configuration();
 ini_set('session.use_strict_mode','1');
 session_name('no1_session');
 session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>$c['secure_cookies'],'httponly'=>true,'samesite'=>'Lax']);
 if(!session_start())throw new RuntimeException('Session storage unavailable');
 if(!isset($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(32));
 $method=$_SERVER['REQUEST_METHOD'];$action=$_GET['action']??'bootstrap';
 if(!in_array($method,['GET','POST'],true))fail('Method not allowed',405);
 if($method==='POST' && !hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))fail('กรุณารีเฟรชหน้าแล้วลองใหม่',403);
 $postActions=['register','login','logout','book','slip','cancel','admin_action','field_save','settings_save','payment_qr','field_image'];
 if(in_array($action,$postActions,true) && $method!=='POST')fail('Method not allowed',405);
 if(!in_array($action,$postActions,true) && $method!=='GET')fail('Method not allowed',405);
 expireBookings();
 if($action==='bootstrap'){
  $settings=query('SELECT * FROM settings WHERE id=1')->fetch();
  $settings['payment_qr']=$settings['payment_qr']?'api/index.php?action=payment_image':null;
  result(['user'=>currentUser(false),'csrf'=>$_SESSION['csrf'],'fields'=>query('SELECT * FROM fields WHERE active=1 ORDER BY id')->fetchAll(),'settings'=>$settings,'server_time'=>date(DATE_ATOM)]);
 }
 if($action==='register'){
  rateLimit('register:'.($_SERVER['REMOTE_ADDR']??''),10);$d=input();
  $name=textValue($d['name']??'',120);$email=strtolower(textValue($d['email']??'',190));$phone=preg_replace('/[\s-]/','',textValue($d['phone']??'',20));$password=$d['password']??'';
  if(!$name || (!$email && !$phone))fail('กรอกชื่อ และอีเมลหรือเบอร์โทร');
  if($email && !filter_var($email,FILTER_VALIDATE_EMAIL))fail('อีเมลไม่ถูกต้อง');
  if($phone && !preg_match('/^0[0-9]{8,9}$/',$phone))fail('เบอร์โทรไม่ถูกต้อง');
  if(!is_string($password)||strlen($password)<12||strlen($password)>72)fail('รหัสผ่านต้องมี 12–72 ตัวอักษร');
  try{query('INSERT INTO users(name,email,phone,password_hash) VALUES (?,?,?,?)',[$name,$email?:null,$phone?:null,password_hash($password,PASSWORD_DEFAULT)]);}catch(PDOException $e){if($e->getCode()==='23000')fail('อีเมลหรือเบอร์โทรนี้ถูกใช้แล้ว',409);throw $e;}
  session_regenerate_id(true);$_SESSION['uid']=(int)db()->lastInsertId();$_SESSION['csrf']=bin2hex(random_bytes(32));result(['user'=>currentUser(),'csrf'=>$_SESSION['csrf']]);
 }
 if($action==='login'){
  $d=input();$identity=strtolower(textValue($d['identity']??'',190));rateLimit('login-ip:'.($_SERVER['REMOTE_ADDR']??''),40);rateLimit('login:'.$identity,12);
  $u=query('SELECT * FROM users WHERE email=? OR phone=?',[$identity,preg_replace('/[\s-]/','',$identity)])->fetch();
  $password=is_string($d['password']??null)?$d['password']:'';
  if(!$u || !password_verify($password,$u['password_hash'])){usleep(200000);fail('อีเมล เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง',401);}
  session_regenerate_id(true);$_SESSION['uid']=(int)$u['id'];$_SESSION['csrf']=bin2hex(random_bytes(32));result(['user'=>currentUser(),'csrf'=>$_SESSION['csrf']]);
 }
 if($action==='logout'){$_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));result(['csrf'=>$_SESSION['csrf']]);}
 if($action==='availability'){
  $date=textValue($_GET['date']??'',10);if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date))fail('วันที่ไม่ถูกต้อง');
 result(['slots'=>query("SELECT field_id,start_hour,end_hour FROM bookings WHERE booking_date=? AND status IN ('pending_payment','review','confirmed','checked_in','completed')",[$date])->fetchAll(),'server_time'=>date(DATE_ATOM)]);
 }
 if($action==='book'){
  $u=currentUser();if($u['role']==='admin')fail('บัญชีแอดมินใช้สำหรับจัดการสนามเท่านั้น',403);$d=input();$date=textValue($d['date']??'',10);$start=filter_var($d['start']??null,FILTER_VALIDATE_INT);$end=filter_var($d['end']??null,FILTER_VALIDATE_INT);$field=filter_var($d['field_id']??null,FILTER_VALIDATE_INT);
  $dt=DateTimeImmutable::createFromFormat('!Y-m-d',$date);
  if(!$dt||$dt->format('Y-m-d')!==$date||$date<date('Y-m-d')||$date>date('Y-m-d',strtotime('+90 days'))||$start===false||$end===false||$start<9||$end>23||$end<=$start||strtotime($date.sprintf(' %02d:00:00',$start))<=time())fail('เลือกวันและเวลาระหว่าง 09:00–23:00 ภายใน 90 วัน');
  db()->beginTransaction();
  // Serialize reservations and field price edits on the same field row.
  $f=query('SELECT * FROM fields WHERE id=? FOR UPDATE',[$field])->fetch();
  if(!$f||!$f['active']){db()->rollBack();fail('สนามนี้ยังไม่เปิดจอง',409);}
  if(!query('SELECT booking_enabled FROM settings WHERE id=1')->fetchColumn()){db()->rollBack();fail('ยังไม่เปิดรับจอง',409);}
  query('SELECT id FROM users WHERE id=? FOR UPDATE',[$u['id']]);
  if(query("SELECT COUNT(*) FROM bookings WHERE user_id=? AND status IN ('pending_payment','review')",[$u['id']])->fetchColumn()>=3){db()->rollBack();fail('คุณมีรายการรอดำเนินการครบ 3 รายการแล้ว');}
    $exists=query("SELECT id FROM bookings WHERE field_id=? AND booking_date=? AND start_hour<? AND end_hour>? AND status IN ('pending_payment','review','confirmed','checked_in','completed') LIMIT 1",[$field,$date,$end,$start])->fetch();
 if($exists){db()->rollBack();fail('เต็มแล้ว มีผู้จองช่วงเวลานี้ กรุณาเลือกเวลาใหม่',409);}
  $code='N1-'.strtoupper(bin2hex(random_bytes(6)));
  query('INSERT INTO bookings(code,user_id,field_id,field_name,booking_date,start_hour,end_hour,amount,expires_at) VALUES (?,?,?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 15 MINUTE))',[$code,$u['id'],$field,$f['name'],$date,$start,$end,round((float)$f['price']*($end-$start),2)]);
  $id=(int)db()->lastInsertId();audit((int)$u['id'],$id,'created');db()->commit();result(publicBooking(bookingForUser($code,$u)));
 }
 if($action==='my_bookings'){$u=currentUser();result(array_map('publicBooking',query('SELECT b.*,u.name,u.phone,u.email FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.user_id=? ORDER BY b.created_at DESC LIMIT 200',[$u['id']])->fetchAll()));}
 if($action==='slip'){
  $u=currentUser();$code=textValue($_POST['code']??'',32);$b=bookingForUser($code,$u);
  if($b['status']!=='pending_payment')fail('รายการนี้แนบสลิปไม่ได้แล้ว',409);
  [$file,$mime,$hash]=imageUpload('image');
  try{
   db()->beginTransaction();$b=query('SELECT * FROM bookings WHERE code=? FOR UPDATE',[$code])->fetch();
   if($b['status']!=='pending_payment'||strtotime($b['expires_at'])<=time()){db()->rollBack();unlink($c['storage_dir'].'/'.$file);fail('หมดเวลาชำระ กรุณาจองใหม่ หากโอนแล้วให้ติดต่อสนาม',409);}
   query("UPDATE bookings SET status='review',slip_file=?,slip_mime=?,slip_hash=? WHERE id=?",[$file,$mime,$hash,$b['id']]);audit((int)$u['id'],(int)$b['id'],'slip_uploaded');db()->commit();
  }catch(Throwable $e){if(db()->inTransaction())db()->rollBack();unlink($c['storage_dir'].'/'.$file);if($e instanceof PDOException && $e->getCode()==='23000')fail('สลิปนี้ถูกใช้กับรายการอื่นแล้ว',409);throw $e;}
  result(['ok'=>true,'booking'=>publicBooking(bookingForUser($code,$u))]);
 }
 if($action==='cancel'){
  $u=currentUser();$d=input();$b=bookingForUser(textValue($d['code']??'',32),$u);
  db()->beginTransaction();
  $s=query("UPDATE bookings SET status='cancelled' WHERE id=? AND status='pending_payment' AND expires_at>NOW()",[$b['id']]);
  if(!$s->rowCount()){db()->rollBack();fail('ยกเลิกได้เฉพาะรายการที่ยังไม่ส่งสลิปและยังไม่หมดเวลา ติดต่อสนามหากโอนแล้ว',409);}
  audit((int)$u['id'],(int)$b['id'],'cancelled');db()->commit();result(['ok'=>true,'booking'=>publicBooking(bookingForUser($b['code'],$u))]);
 }
 if($action==='slip_image'){
  $u=admin();$b=bookingForUser(textValue($_GET['code']??'',32),$u);if(!$b['slip_file'])fail('ไม่มีสลิป',404);
  header('Content-Type: '.$b['slip_mime']);readfile($c['storage_dir'].'/'.$b['slip_file']);exit;
 }
 if($action==='payment_image'){
  $file=query('SELECT payment_qr FROM settings WHERE id=1')->fetchColumn();if(!$file)fail('ยังไม่มี QR รับเงิน',404);
  $path=$c['storage_dir'].'/'.basename($file);header('Content-Type: '.(new finfo(FILEINFO_MIME_TYPE))->file($path));readfile($path);exit;
 }
 if($action==='admin_bookings'){
  admin();$page=max(1,(int)($_GET['page']??1));$offset=($page-1)*50;$filter=textValue($_GET['filter']??'',30);$search=textValue($_GET['search']??'',120);
  $where=' WHERE 1=1';$v=[];
  if($filter){$where.=' AND b.status=?';$v[]=$filter;}
  if($search){$where.=' AND (b.code LIKE ? OR u.name LIKE ? OR u.phone LIKE ?)';array_push($v,'%'.$search.'%','%'.$search.'%','%'.$search.'%');}
  $total=query('SELECT COUNT(*) FROM bookings b JOIN users u ON b.user_id=u.id'.$where,$v)->fetchColumn();
  $rows=query('SELECT b.*,u.name,u.phone,u.email FROM bookings b JOIN users u ON b.user_id=u.id'.$where.' ORDER BY b.created_at DESC LIMIT 50 OFFSET '.(int)$offset,$v)->fetchAll();
  $stats=query("SELECT COUNT(*) total,COALESCE(SUM(status='review'),0) review,COALESCE(SUM(status='checked_in'),0) playing,COALESCE(SUM(CASE WHEN status IN ('confirmed','checked_in','completed') THEN amount ELSE 0 END),0) revenue FROM bookings")->fetch();
  $dashboard=query("SELECT COUNT(*) total,COALESCE(SUM(status='pending_payment'),0) pending,COALESCE(SUM(status='review'),0) review,COALESCE(SUM(status='confirmed'),0) confirmed,COALESCE(SUM(status='checked_in'),0) playing,COALESCE(SUM(status='completed'),0) completed,COALESCE(SUM(status IN ('confirmed','checked_in','completed')),0) paid_count,COALESCE(SUM(CASE WHEN status IN ('confirmed','checked_in','completed') THEN amount ELSE 0 END),0) revenue FROM bookings")->fetch();
  $popular=query("SELECT field_name,COUNT(*) bookings,COALESCE(SUM(CASE WHEN status IN ('confirmed','checked_in','completed') THEN amount ELSE 0 END),0) revenue FROM bookings GROUP BY field_id,field_name ORDER BY bookings DESC, revenue DESC LIMIT 5")->fetchAll();
  result(['rows'=>array_map('publicBooking',$rows),'total'=>(int)$total,'stats'=>$stats,'dashboard'=>['summary'=>$dashboard,'popular_fields'=>$popular]]);
 }
 if($action==='admin_action'){
  $u=admin();$d=input();$code=textValue($d['code']??'',100);$type=textValue($d['type']??'',20);$note=textValue($d['note']??'',500);
  db()->beginTransaction();$b=query('SELECT * FROM bookings WHERE code=? OR ticket_token=? FOR UPDATE',[$code,$code])->fetch();
  if(!$b){db()->rollBack();fail('ไม่พบตั๋ว',404);}
  if($type==='approve' && $b['status']==='review'){
   if(empty($b['slip_file'])){db()->rollBack();fail('ไม่พบสลิปสำหรับยืนยันการชำระเงิน',409);}
   $finished=strtotime($b['booking_date'].sprintf(' %02d:00:00',$b['end_hour']))<=time();
   query("UPDATE bookings SET status=?,ticket_token=?,review_note=?,completed_at=? WHERE id=?",[$finished?'completed':'confirmed',bin2hex(random_bytes(32)),$note,$finished?date('Y-m-d H:i:s'):null,$b['id']]);
  }elseif($type==='reject' && $b['status']==='review'){
   if(!$note){db()->rollBack();fail('กรุณาระบุเหตุผลที่ไม่ผ่าน');}
   query("UPDATE bookings SET status='rejected',review_note=? WHERE id=?",[$note,$b['id']]);
  }elseif($type==='checkin' && $b['status']==='confirmed'){
   $begin=strtotime($b['booking_date'].sprintf(' %02d:00:00',$b['start_hour']));$finish=strtotime($b['booking_date'].sprintf(' %02d:00:00',$b['end_hour']));
   if(time()<$begin-1800||time()>=$finish){db()->rollBack();fail('เช็คอินได้ก่อนเวลา 30 นาทีจนถึงเวลาสิ้นสุด',409);}
   query("UPDATE bookings SET status='checked_in',checked_in_at=NOW() WHERE id=?",[$b['id']]);
  }elseif($type==='complete' && $b['status']==='checked_in'){
   query("UPDATE bookings SET status='completed',completed_at=NOW() WHERE id=?",[$b['id']]);
  }else{db()->rollBack();fail('สถานะเปลี่ยนแล้วหรือไม่สามารถดำเนินการนี้ได้',409);}
  audit((int)$u['id'],(int)$b['id'],$type,$note);db()->commit();result(['ok'=>true,'code'=>$b['code'],'booking'=>publicBooking(bookingForUser($b['code'],$u))]);
 }
 if($action==='ticket_lookup'){
  $u=admin();$code=textValue($_GET['code']??'',100);$b=query('SELECT b.*,u.name,u.phone,u.email FROM bookings b JOIN users u ON b.user_id=u.id WHERE b.code=? OR b.ticket_token=?',[$code,$code])->fetch();if(!$b)fail('ไม่พบตั๋ว',404);result(publicBooking($b));
 }
 if($action==='admin_fields'){admin();result(query('SELECT * FROM fields ORDER BY id')->fetchAll());}
 if($action==='field_save'){
  $u=admin();$d=input();$id=(int)($d['id']??0);$name=textValue($d['name']??'',100);$description=textValue($d['description']??'',2000);$price=filter_var($d['price']??null,FILTER_VALIDATE_FLOAT);$url=textValue($d['image_url']??'',500);
  if(!$name||$price===false||$price<=0||$price>100000)fail('กรอกชื่อสนามและราคาที่มากกว่า 0');
  if($url && !str_starts_with($url,'api/index.php?action=field_photo&id=') && !preg_match('#^https://#',$url))fail('รูปต้องเป็นลิงก์ HTTPS');
  if($id){query('UPDATE fields SET name=?,description=?,price=?,image_url=?,active=? WHERE id=?',[$name,$description,round($price,2),$url,!empty($d['active'])?1:0,$id]);}else{query('INSERT INTO fields(name,description,price,image_url,active) VALUES (?,?,?,?,?)',[$name,$description,round($price,2),$url,!empty($d['active'])?1:0]);$id=(int)db()->lastInsertId();}
  audit((int)$u['id'],null,'field_saved',(string)$id);result(['ok'=>true,'id'=>$id]);
 }
 if($action==='settings_save'){
  $u=admin();$d=input();$values=[];foreach(['address','contact','facilities','promotion','rules'] as $k)$values[]=textValue($d[$k]??'', $k==='contact'?120:3000);$values[]=!empty($d['booking_enabled'])?1:0;
  query('UPDATE settings SET address=?,contact=?,facilities=?,promotion=?,rules=?,booking_enabled=? WHERE id=1',$values);audit((int)$u['id'],null,'settings_saved');result(['ok'=>true]);
 }
 if($action==='payment_qr'){
  $u=admin();[$file]=imageUpload('image');query('UPDATE settings SET payment_qr=? WHERE id=1',[$file]);audit((int)$u['id'],null,'payment_qr_uploaded');result(['ok'=>true]);
 }
 if($action==='field_image'){
  $u=admin();$id=(int)($_POST['id']??0);if(!query('SELECT id FROM fields WHERE id=?',[$id])->fetch())fail('บันทึกสนามก่อน');
  [$file]=imageUpload('image');query('UPDATE fields SET image_url=? WHERE id=?',['api/index.php?action=field_photo&id='.$file,$id]);audit((int)$u['id'],null,'field_image_uploaded',(string)$id);result(['ok'=>true]);
 }
 if($action==='field_photo'){
  $name=textValue($_GET['id']??'',80);if(!preg_match('/^[a-f0-9]{48}\.(jpg|png|webp)$/',$name))fail('ไม่พบรูป',404);
  if(!query('SELECT id FROM fields WHERE image_url=?',['api/index.php?action=field_photo&id='.$name])->fetch())fail('ไม่พบรูป',404);
  $path=$c['storage_dir'].'/'.$name;header('Content-Type: '.(new finfo(FILEINFO_MIME_TYPE))->file($path));readfile($path);exit;
 }
 if($action==='audit'){admin();result(query('SELECT a.*,u.name FROM audit_logs a JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200')->fetchAll());}
 fail('ไม่พบคำขอ',404);
}catch(Throwable $e){
 if(isset($c)){try{if(db()->inTransaction())db()->rollBack();}catch(Throwable){}}
 error_log('No1 API: '.$e->getMessage());fail('ระบบยังไม่พร้อมใช้งาน กรุณาลองใหม่หรือติดต่อผู้ดูแล',503);
}
