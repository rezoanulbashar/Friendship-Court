<?php
// Friendship Court — hosting check. Open yoursite.com/check.php in a browser.
// This page only reads information; it changes nothing and stores nothing.
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$base = __DIR__;
$files = [
  'index.html', 'assets/css/style.css', 'assets/js/app.js',
  'assets/js/certificate.js', 'assets/js/pdf.js', 'assets/img/favicon.svg',
];
$rows = [];
$rows[] = ['PHP is running', true, 'PHP ' . PHP_VERSION . ' (the app itself does not need PHP)'];
foreach ($files as $f) {
  $ok = is_file($base . '/' . $f) && is_readable($base . '/' . $f);
  $rows[] = ['File: ' . $f, $ok, $ok ? 'Found' : 'Missing — re-upload the ZIP and extract it again'];
}
$rows[] = ['.htaccess security file', is_file($base . '/.htaccess'), is_file($base . '/.htaccess') ? 'Found' : 'Not found (optional, but recommended — make sure hidden files were extracted)'];
$allOk = true;
foreach ($rows as $r) { if (!$r[1] && strpos($r[0], '.htaccess') === false) { $allOk = false; } }
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Friendship Court — Hosting check</title>
<link rel="stylesheet" href="assets/css/style.css">
</head><body>
<main class="form-shell"><div class="form-paper">
  <span class="step-label">Hosting check</span>
  <h2><?= $allOk ? 'Everything is in order.' : 'Something is missing.' ?></h2>
  <p class="hint"><?= $allOk ? 'Your website is ready. Open the homepage and file your first complaint.' : 'Upload the ZIP again and use “Extract” in File Manager, then reload this page.' ?></p>
  <dl class="review">
  <?php foreach ($rows as $r): ?>
    <div class="review-row"><dt><?= e($r[0]) ?></dt><dd><?= $r[1] ? '✔ ' : '✖ ' ?><?= e($r[2]) ?></dd></div>
  <?php endforeach; ?>
  </dl>
  <div class="form-nav"><a class="btn btn-primary" href="./">Open Friendship Court</a></div>
  <p class="tiny">You can delete check.php after installation. It is safe to keep.</p>
</div></main>
</body></html>
