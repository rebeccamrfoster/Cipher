import React from 'react';
import { AuthRoute, ProtectedRoute } from '../util/route_util';
import { Route, Switch } from 'react-router-dom';
import NavBarContainer from './nav/navbar_container';

import ProblemIndexContainer from './problem_index/problem_index_container';
import DocumentShowContainer from './document_show/document_show_container';
// import MainPage from './main/main_page';
import LoginFormContainer from './session/login_form_container';
import RegisterFormContainer from './session/register_form_container';
import DashboardContainer from './profile/dashboard';
// import TweetComposeContainer from './problem_index/tweet_compose_container';
import Splash from "./splash/splash";
import Footer from "./footer/footer";
import GroupShowDummy from "./group_show_dummy";


const App = () => (
  <div className="page-container">
    <div className="main-content">
      <NavBarContainer />
      {/* <GroupShowDummy /> */}
      <Switch>
        <Route exact path="/" component={Splash} />
        <AuthRoute exact path="/login" component={LoginFormContainer} />
        <AuthRoute exact path="/register" component={RegisterFormContainer} />

        <ProtectedRoute exact path="/problems" component={ProblemIndexContainer} />
        {/* <ProtectedRoute exact path="/groups/:groupId" component={GroupShowContainer} /> */}
        <ProtectedRoute exact path="/dashboard" component={DashboardContainer} />
        <ProtectedRoute exact path="/document/:documentId" component={DocumentShowContainer} />
        {/* <ProtectedRoute exact path="/new_tweet" component={TweetComposeContainer} /> */}
      </Switch>
    </div>
    <Footer />
  </div>
);

export default App;
