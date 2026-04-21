import fs from 'fs';

for (const f of ['index.html', 'css/main.css', 'js/main.js']) {
  let s = fs.readFileSync(f, 'utf8');
  const orig = s;

  s = s.replace(/src="\/images/g, 'src="images');
  s = s.replace(/href="\/images/g, 'href="images');
  s = s.replace(/srcset="\/images/g, 'srcset="images');
  s = s.replace(/href="\/css/g, 'href="css');
  s = s.replace(/src="\/js/g, 'src="js');
  s = s.replace(/url\('\/images/g, "url('images");
  s = s.replace(/'\/images\//g, "'images/");
  s = s.replace(/"\/images\//g, '"images/');
  s = s.replace(/`\/images\//g, '`images/');

  if (s !== orig) {
    fs.writeFileSync(f, s);
    console.log('updated', f);
  } else {
    console.log('no change', f);
  }
}
