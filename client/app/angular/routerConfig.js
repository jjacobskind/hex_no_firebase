export default ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) => {
  $urlRouterProvider.otherwise('/');
  $locationProvider.html5Mode(true);
  $httpProvider.interceptors.push('authInterceptor');
}
