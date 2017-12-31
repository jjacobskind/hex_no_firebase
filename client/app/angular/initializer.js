export default ($cookieStore, $rootScope, $location, $state, Auth) => {
  // Redirect to login if route requires auth and you're not logged in
  $rootScope.$on('$stateChangeStart', (event, next) => {
    Auth.isLoggedInAsync(function(loggedIn) {
      if (!next.authenticate || loggedIn) { return }
      if ($location.url() != '/login') {
        $cookieStore.put('returnUrl', $location.url());
      }
      $location.path('/login');
    });
  });
}
