<?php 
include 'Parser.php'
echo Parser::parse($_POST['text'], $_POST['title']);
 ?>