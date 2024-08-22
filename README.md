# node-mbox-extract

mbox file parser for Node.js.

### Install

From the Github repository:

```
$ git clone https://github.com/marek3289/node-mbox-extract.git
$ cd node-mbox-extract
$ npm install
```

### Description

This module parses mbox files, as described [here](http://qmail.org./man/man5/mbox.html). Starting with version 0.1.0, it's pretty speedy, processing a 1.5GB mbox file in about 20 seconds.

Note that this module doesn't parse the mail messages themselves, for which other solutions exist (for example the quite able [mailparser](https://github.com/andris9/mailparser) module from Andris Reinman).

### Usage

See the included `extract.js`:

```
$ npm install mailparser
$ node extract < files/<filename>.mbox
```
