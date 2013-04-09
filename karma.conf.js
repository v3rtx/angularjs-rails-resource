basePath = './';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'test/lib/angular/angular.js',
  'test/lib/angular/angular-bootstrap.js',
  'test/lib/angular/angular-loader.js',
  'test/lib/angular/angular-sanitize.js',
  'test/lib/angular/angular-mocks.js',
  'vendor/assets/javascripts/**/*.js',
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};