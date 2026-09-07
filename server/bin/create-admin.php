<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/bootstrap.php';
echo "Admin name: ";$name=trim(fgets(STDIN));
echo "Admin email: ";$email=strtolower(trim(fgets(STDIN)));
echo "Admin password (12–72 characters, input is visible): ";$password=trim(fgets(STDIN));
if(!$name||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($password)<12||strlen($password)>72){fwrite(STDERR,"Invalid input\n");exit(1);}
query("INSERT INTO users(name,email,password_hash,role) VALUES (?,?,?,'admin')",[$name,$email,password_hash($password,PASSWORD_DEFAULT)]);
echo "Admin created.\n";
