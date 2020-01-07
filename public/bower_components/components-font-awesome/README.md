Font Awesome
============

Shim repository for Font Awesome.

The full suite of pictographic icons, examples, and documentation can be found at:
http://fortawesome.github.com/Font-Awesome/


Package Managers
----------------

* [npm](http://npmjs.org): `components-font-awesome`
* [Bower](http://bower.io): `components-font-awesome`
* [Component](https://github.com/component/component): `components/font-awesome`
* [Composer](http://packagist.org/packages/components/font-awesome): `components/font-awesome`

Installation
------------
### Gulp

##### Re-compile bower
If using bower, do not forget to re-compile bower using `gulp bower`. Here is the sample code if you do not have one.

``` javascript
// Update Foundation with Bower and save to /vendor
gulp.task('bower', function() {
  return bower({ cmd: 'update'})
    .pipe(gulp.dest('vendor/'))
});
```
##### Combine css
With gulp, usually there is a function to combine all *scss* to *css* file for faster page loads.
In the sample case we run function `gulp style` to combine all scss to css file under **./assets/css/**

##### Move font font folder
Here is the **important part**, the default *font folder* is on different path with the compiled bower file. We need to move the font from default *font folder* to the *compiled bower folder* (In the example `vendor` is the compiled folder).

``` javascript
// Move font-awesome fonts folder to css compiled folder
gulp.task('icons', function() {
    return gulp.src('./vendor/components-font-awesome/webfonts/**.*')
        .pipe(gulp.dest('./assets/fonts'));
});
```

License
-------

- The Font Awesome font is licensed under the SIL Open Font License - http://scripts.sil.org/OFL
- Font Awesome CSS, LESS, and SASS files are licensed under the MIT License - http://opensource.org/licenses/mit-license.html
- The Font Awesome pictograms are licensed under the CC BY 3.0 License - http://creativecommons.org/licenses/by/3.0/
- Attribution is no longer required in Font Awesome 3.0, but much appreciated: "Font Awesome by Dave Gandy - http://fortawesome.github.com/Font-Awesome"
