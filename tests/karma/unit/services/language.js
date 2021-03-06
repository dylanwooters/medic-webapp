describe('Language service', function() {

  'use strict';

  var service,
      UserSettings = sinon.stub(),
      Settings = sinon.stub(),
      ipCookie = sinon.stub(),
      $rootScope;

  beforeEach(function() {
    module('inboxApp');
    module(function($provide) {
      $provide.value('UserSettings', UserSettings);
      $provide.value('Settings', Settings);
      $provide.value('ipCookie', ipCookie);
    });
    inject(function(_Language_, _$rootScope_) {
      $rootScope = _$rootScope_;
      service = _Language_;
    });
  });

  afterEach(function() {
    KarmaUtils.restore(UserSettings, Settings, ipCookie);
  });

  it('uses the language configured in user', function(done) {
    ipCookie.returns(null);
    UserSettings.callsArgWith(0, null, { language: 'latin' });
    service().then(function(actual) {
      chai.expect(actual).to.equal('latin');
      chai.expect(UserSettings.callCount).to.equal(1);
      chai.expect(Settings.callCount).to.equal(0);
      chai.expect(ipCookie.callCount).to.equal(2);
      chai.expect(ipCookie.args[0][0]).to.equal('locale');
      chai.expect(ipCookie.args[1][0]).to.equal('locale');
      chai.expect(ipCookie.args[1][1]).to.equal('latin');
      chai.expect(ipCookie.args[1][2]).to.deep.equal({ expires: 365, path: '/' });
      done();
    });
    $rootScope.$digest();
  });

  it('uses the language configured in settings', function(done) {
    ipCookie.returns(null);
    UserSettings.callsArgWith(0, null, { });
    Settings.returns(KarmaUtils.mockPromise(null, { locale: 'yiddish' }));
    service().then(function(actual) {
      chai.expect(actual).to.equal('yiddish');
      chai.expect(UserSettings.callCount).to.equal(1);
      chai.expect(Settings.callCount).to.equal(1);
      chai.expect(ipCookie.callCount).to.equal(2);
      chai.expect(ipCookie.args[0][0]).to.equal('locale');
      chai.expect(ipCookie.args[1][0]).to.equal('locale');
      chai.expect(ipCookie.args[1][1]).to.equal('yiddish');
      chai.expect(ipCookie.args[1][2]).to.deep.equal({ expires: 365, path: '/' });
      done();
    });
    setTimeout(function() {
      $rootScope.$digest();
    });
  });

  it('defaults', function(done) {
    ipCookie.returns(null);
    UserSettings.callsArgWith(0, null, { });
    Settings.returns(KarmaUtils.mockPromise(null, { }));
    service().then(function(actual) {
      chai.expect(actual).to.equal('en');
      chai.expect(UserSettings.callCount).to.equal(1);
      chai.expect(Settings.callCount).to.equal(1);
      chai.expect(ipCookie.callCount).to.equal(2);
      chai.expect(ipCookie.args[0][0]).to.equal('locale');
      chai.expect(ipCookie.args[1][0]).to.equal('locale');
      chai.expect(ipCookie.args[1][1]).to.equal('en');
      chai.expect(ipCookie.args[1][2]).to.deep.equal({ expires: 365, path: '/' });
      done();
    });
    setTimeout(function() {
      $rootScope.$digest();
    });
  });

  it('uses cookie if set', function(done) {
    ipCookie.returns('ca');
    service().then(function(actual) {
      chai.expect(UserSettings.callCount).to.equal(0);
      chai.expect(Settings.callCount).to.equal(0);
      chai.expect(ipCookie.callCount).to.equal(1);
      chai.expect(actual).to.equal('ca');
      done();
    });
    $rootScope.$digest();
  });

});