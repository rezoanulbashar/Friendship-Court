FRIENDSHIP COURT — THE €100 AGREEMENT GENERATOR
================================================

A joke website. Upload a friend's photo, choose their "crimes", and generate an
official-looking Friendship Misconduct Agreement with a €100 joke fine.
For entertainment only. Not a legally binding contract. No real money is owed.


HOW TO PUT IT ON VERCEL (free, about 5 minutes, no coding)
----------------------------------------------------------
Vercel does not accept ZIP uploads directly, so the files go through a free
GitHub account first. Everything happens in your web browser.

1. Unzip the download on your computer. You get a folder "friendship-court".
2. Go to github.com and sign up / log in (free).
3. Click "+" (top right) > "New repository". Name it "friendship-court",
   choose Public or Private, click "Create repository".
4. On the next page click "uploading an existing file".
5. Open the "friendship-court" folder on your computer, select EVERYTHING
   inside it (index.html, the assets folder, vercel.json, etc.) and drag it
   onto the GitHub page. Wait for the upload, then click "Commit changes".
   Important: drag the CONTENTS of the folder, not the folder itself, so
   index.html sits at the top level of the repository.
   (On a Mac, press Cmd+Shift+. in Finder to show hidden files such as
   .vercelignore. It is optional; the site works without it.)
6. Go to vercel.com and click "Sign up" > "Continue with GitHub".
7. Click "Add New..." > "Project", find "friendship-court", click "Import".
8. Leave every setting as it is ("Framework Preset: Other", no build
   command) and click "Deploy".
9. After about 30 seconds Vercel shows your live address, for example
   https://friendship-court.vercel.app  — open it. Done.

To change the site later, upload the new files to the same GitHub
repository; Vercel republishes automatically.

On Vercel, security headers come from vercel.json (included). check.php,
.htaccess files and this README are not used there and are skipped.


HOW TO INSTALL ON cPANEL HOSTING (alternative)
----------------------------------------------
1. Download the ZIP file.
2. Log in to cPanel.
3. Open "File Manager".
4. Open "public_html" (or a subfolder, for example public_html/court).
5. Click "Upload" and choose the ZIP file.
6. Back in File Manager, right-click the ZIP and choose "Extract".
   The files are inside a folder called "friendship-court".
   - Want the site at yoursite.com/friendship-court?  You're done.
   - Want it at yoursite.com directly?  Open the "friendship-court" folder,
     select everything inside it (use "Select All"), click "Move" and move
     it to /public_html. Tip: in File Manager "Settings", tick
     "Show Hidden Files" so the .htaccess file is moved too.
7. Open your website in a browser.
8. Optional: open  yoursite.com/check.php  (or .../friendship-court/check.php)
   to confirm every file was uploaded correctly.

There is nothing to configure. No database, no passwords, no settings.


HOSTING REQUIREMENTS
--------------------
- Any web hosting that can serve normal web pages (all cPanel hosting can).
- PHP is NOT required for the app. It is only used by the optional check.php page.
- No database. No Node.js. No build step. No paid services.
- Works in current versions of Chrome, Safari, Firefox, Edge (desktop and mobile).
- Fonts load from Google Fonts. If that service is unavailable, the site still
  works and uses standard fonts instead.


HOSTING CHECKLIST
-----------------
[ ] The ZIP was extracted (not just uploaded).
[ ] index.html is in the folder you open in the browser.
[ ] The "assets" folder sits next to index.html.
[ ] check.php shows "Everything is in order."
[ ] Optional: HTTPS is enabled on your domain (needed for the one-tap
    "Copy message" button on some browsers; a fallback is built in).


PRIVACY AND SECURITY
--------------------
- Photos never leave the visitor's device. They are checked (type, size and
  file signature), resized in the browser and kept only in memory. Closing or
  refreshing the page deletes them. Nothing is uploaded or stored on your server.
- No form data is sent to the server. No cookies, no tracking, no accounts.
- Only JPG, JPEG, PNG and WebP images up to 10 MB are accepted. Files that
  pretend to be images are rejected.
- Names are drawn onto the document as plain text, so they cannot inject code.
- .htaccess adds browser security headers (where your host supports them).
- assets/.htaccess blocks any script from running inside the assets folder.


FEATURES
--------
- Landing page with sample agreement, example violations and disclaimer.
- 7-step form: your name, friend's name, photo, violations, custom violation,
  punishment, review. Back/Edit at every step, with friendly error messages.
- Photo preview with Replace and Remove, drag-and-drop, "continue without photo".
- Generated A4 agreement: unique agreement number, today's date, framed
  "THE ACCUSED" portrait, five articles, Friendship Court seal, red
  "GUILTY OF BEING ANNOYING" stamp, signature lines, judge's signature,
  gold and burgundy border.
- Download as PDF (single A4 page, made in the browser), Download as PNG,
  Print (one A4 page), Copy funny message, Share (on phones), Edit, Start over.
- If PDF download fails, the print dialog opens so you can "Save as PDF".


FILES
-----
index.html               The website
assets/css/style.css     Design
assets/js/app.js         Form, photo handling, buttons
assets/js/certificate.js Draws the agreement
assets/js/pdf.js         Creates the PDF file
assets/img/favicon.svg   Browser tab icon
.htaccess                Security headers (optional)
assets/.htaccess         Blocks scripts in assets (optional)
check.php                Optional installation check
README.txt               This file
