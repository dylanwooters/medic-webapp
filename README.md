# Medic Mobile

These instructions should help you get setup to run or develop on Medic Mobile.
For latest changes and release announcements see our [change log](Changes.md).

## Overview

Medic Mobile combines messaging, data collection, and analytics for health workers and health systems in hard-to-reach areas with or without internet connectivity.

The `medic-webapp` repository is the core application in the Medic Mobile stack. When health workers submit data — using text messages (SMS), our mobile applications, or our SIM applications — the web app colunfirms data submission, generates unique IDs, and schedules automated reminder messages based on user-defined configurations. All information submitted by mobile users can be viewed, filtered, verified, and exported using the reports tab in the web application.

The web app is fully responsive with a mobile-first design, and supports localization using any written language. It can be installed locally, as part of a virtual machine (see [medic-os](https://github.com/medic/medic-os)), or in the cloud.

For more information about Medic Mobile's tools, visit http://medicmobile.org/tools.

## Development Setup

Before getting started, read about our [development workflow](https://github.com/medic/medic-docs/blob/master/md/dev/workflow.md).

### Dependencies

You will need to install the following:

[Node.js](http://nodejs.org) v0.12.x

[CouchDB](http://couchdb.apache.org) v1.6.1

[couchdb-lucene](https://github.com/rnewson/couchdb-lucene) v1.0.2 or greater

### Setup CouchDB

Setup admin access:
```
curl -X PUT http://localhost:5984/_config/admins/admin -d '"pass"'
```

Reconfigure CouchDB to require authentication:
```
curl -X PUT http://admin:pass@localhost:5984/_config/couch_httpd_auth/require_valid_user \
  -d '"true"' -H "Content-Type: application/json"
```

The above command automatically modifies `local.ini` to contain:
```
[couch_httpd_auth]
require_valid_user = true
```

Create an admin user:
```
curl -X POST http://admin:pass@localhost:5984/_users \
  -H "Content-Type: application/json" \
  -d '{"_id": "org.couchdb.user:admin", "name": "admin", "password":"pass", "type":"user", "roles":[]}'
```

### Kanso

[Kanso](http://kan.so) is required to build and deploy.

```
npm install kanso -g
```

### Grunt

[Grunt](http://gruntjs.com) is required to build.

```
npm install grunt-cli -g
```

### Configure Lucene

Add the following to CouchDB's `httpd_global_handlers` configuration section:

```
_fti = {couch_httpd_proxy, handle_proxy_req, <<"http://127.0.0.1:5985">>}
```

Update `$lucene_home/conf/couchdb-lucene.ini` so the URL has credentials, e.g.:

```
url=http://admin:pass@localhost:5984/
```

Start lucene using the `$lucene_home/bin/run` script.

You should now see an identical welcome message at two different URLs:

```
curl http://localhost:5985
{"couchdb-lucene":"Welcome","version":"1.0.2"}
curl http://localhost:5984/_fti
{"couchdb-lucene":"Welcome","version":"1.0.2"}
```

## Develop

### Build

```
git clone --recursive https://github.com/medic/medic-webapp
cd medic-webapp
npm install
```

Create a `.kansorc` file in the app directory with your CouchDB credentials, e.g.:

```
exports.env = {
  default: {
    db: "http://admin:pass@localhost:5984/medic",
    overrides: {loglevel:"debug"}
  }
};
```


### Push the application

`grunt dev` will build and deploy the webapp, then watch for changes and redeploy when necessary.

### Start medic-sentinel

```
cd sentinel
npm install
export COUCH_URL=http://admin:pass@localhost:5984/medic
node ./server.js
```
See [Medic Sentinel](https://github.com/medic/medic-sentinel) for more information.

### Start medic-api

```
cd api
npm install
export COUCH_URL=http://admin:pass@localhost:5984/medic
node ./server.js
```

See [Medic API](https://github.com/medic/medic-api) for more information.

### Push the dashboard

[Garden Dashboard](https://github.com/garden20/dashboard) is used to manage the couchapp.

To install Dashboard, first change the CouchDB's `secure_rewrites` configuration
parameter to false:

```
curl -X PUT http://admin:pass@localhost:5984/_config/httpd/secure_rewrites \
  -d '"false"' -H "Content-Type: application/json"
```

Next, download, build, and push the dashboard application to CouchDB:

```
git clone https://github.com/garden20/dashboard
cd dashboard
git checkout develop
kanso install
kanso push http://admin:pass@localhost:5984/dashboard
```

Finally install our app in the dashboard.
- Go to [http://localhost:5984/dashboard/_design/dashboard/_rewrite/install](http://localhost:5984/dashboard/_design/dashboard/_rewrite/install)
- Type this in the input "https://staging.dev.medicmobile.org/markets-alpha/details/medic" and click next
- Follow the instructions to install the app

Now you've just overwritten your development installation so you probably want to do another `grunt dev` to overwrite it again.

### Try it out

Navigate your browser to:

```
http://localhost:5988/medic/login
```


### Tests

To run precommit tests:

0. Start CouchDB
1. Start API: `TEST_ENV=1 COUCH_URL=http://admin:pass@localhost:5984/medic node api/server.js`
2. Update Webdriver: `node_modules/grunt-protractor-runner/node_modules/protractor/bin/webdriver-manager update`
3. Start Webdriver: `node_modules/grunt-protractor-runner/node_modules/protractor/bin/webdriver-manager start`
4. Run tests: `grunt test`

Some kanso tests are run in-browser; you can run them manually if you browse to `/medic/_design/medic/_rewrite/test`.

### Loading Data

Loading your form definitions in the settings interface is supported, but you can
also do that from command line:

```
node scripts/load_forms.js
```

To batch-load messages from a CSV file, run:

```
node scripts/load_messages.js
```

Use `curl` to submit a single message:

```
curl -i -u gateway:123qwe \
    --data-urlencode 'message=Test One two' \
    --data-urlencode 'from=+13125551212' \
    --data-urlencode 'sent_timestamp=1403965605868' \
    -X POST \
    http://localhost:5988/api/v1/records
```


### Deploy to Market

When deploying to the market, include the sentinel package in the couchapp so
[gardener](https://github.com/garden20/gardener) can manage the process. This
is already automated in the CI scripts (and runs on Travis CI), but here is the
manual process:

First clone the repo recursively so you get both submodules `api` and
`sentinel`, then change directories:

```
git clone --depth=50 --recursive https://github.com/medic/medic-webapp
cd medic-webapp
```

Then edit `kanso.json`, and add `"kanso-gardener":null` to the end of the list
of dependencies.  You can use a text editor, or
[jsontool](https://github.com/trentm/json) has an edit mode that works:

```
cat kanso.json | json -e \
  'this.dependencies["kanso-gardener"] = null; this.dependencies_included = true;' \
    > new.json && \
mv new.json kanso.json
```

Finally, push to the [Medic Alpha
Market](https://staging.dev.medicmobile.org/markets-alpha/):

```sh
kanso push https://staging.dev.medicmobile.org/markets-alpha/upload
```


## Help

Join our [Google Group](https://groups.google.com/forum/#!forum/medic-developers) or file an issue on Github.

## Build Status

Builds brought to you courtesy of [Travis CI](https://travis-ci.org/medic/medic-webapp).

Develop      | Testing       | Master
------------ | ------------- | ------------
[![Build Status](https://travis-ci.org/medic/medic-webapp.png?branch=develop)](https://travis-ci.org/medic/medic-webapp/branches) | [![Build Status](https://travis-ci.org/medic/medic-webapp.png?branch=testing)](https://travis-ci.org/medic/medic-webapp/branches) | [![Build Status](https://travis-ci.org/medic/medic-webapp.png?branch=master)](https://travis-ci.org/medic/medic-webapp/branches)


## License & Copyright

Copyright 2013-2015 Medic Mobile, Inc. <hello@medicmobile.org>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
