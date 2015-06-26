<?php 
include 'Parser.php'
echo Parser::parse(file_get_contents(STDIN), $argv[1]);
 ?>