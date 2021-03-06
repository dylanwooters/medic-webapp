'use strict';

var inboxControllers = angular.module('inboxControllers');

inboxControllers.controller('AboutCtrl',
  ['$scope', '$q', 'Debug', 'DB', 'Language', 'Session',
  function ($scope, $q, Debug, DB, Language, Session) {
    $scope.filterModel.type = 'help';
    $scope.url = window.location.hostname;
    $scope.userCtx = Session.userCtx();
    $scope.reload = function() {
      window.location.reload(false);
    };
    $scope.enableDebugModel = {
      val: Debug.get()
    };
    $scope.$watch('enableDebugModel.val', Debug.set);

    DB.get().info().then(function (result) {
      $scope.dbInfo = JSON.stringify(result, null, 2);
    }).catch(function (err) {
      console.error('Failed to fetch DB info', err);
    });

    $scope.help_loading = true;

    var helpPageGet = DB.get().query('medic/help_pages');

    $q.all([ helpPageGet, Language() ])
      .then(function(results) {
        var helpPageRes = results[0];
        var lang = results[1];
        $scope.help_loading = false;
        $scope.help_pages = _.map(helpPageRes.rows, function(row) {
          return { id: row.key, title: row.value[lang] || row.value.en };
        });
      });
  }
]);
