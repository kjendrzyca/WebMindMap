'use strict';

var React = require('react'),
    superagent = require('superagent'),
    _ = require('lodash'),
    Articles = require('./articles.jsx');

var mainContainer = document.getElementById('main-container');

var HomePage = React.createClass({
    _connectWithPocket: function() {
        if (window.localStorage.ACCESS_TOKEN) {
            alert('Already connected!');

            return;
        }

        superagent
            .get('/getRequestToken')
            .end(function(error, response) {
                var redirectUri = 'http://localhost:1111?authorizationFinished=true';
                var obtainedRequestToken = response.text;
                window.sessionStorage.REQUEST_TOKEN = obtainedRequestToken;

                var pocketAuthorizationUrl = 'https://getpocket.com/auth/authorize?request_token=' + obtainedRequestToken + '&redirect_uri=' + redirectUri;

                window.location = pocketAuthorizationUrl;

                return;
            });
    },

    getInitialState: function() {
        return {
            pocketData: {
                normalArticles: [],
                archivedArticles: []
            },
            normalFavoritedArticles: []
        };
    },

    componentDidMount: function() {
        if (!window.localStorage.ACCESS_TOKEN) {
            superagent
                .get('/getAccessToken/' + window.sessionStorage.REQUEST_TOKEN)
                .end(function(error, response) {
                    window.localStorage.ACCESS_TOKEN = response.text;
                    console.log('access token: ' + window.localStorage.ACCESS_TOKEN);
                });
        }

        if (window.localStorage.ACCESS_TOKEN) {
            console.log('Authorized !');

            superagent
                .get('/getArticles/' + window.localStorage.ACCESS_TOKEN)
                .end(function(error, response) {
                    this.setState({ pocketData: response.body });
                }.bind(this));
        }
    },

    _favoritesChecked: function() {
        var filteredTagsWithArticlesByFavorited = _.filter(this.state.pocketData.normalArticles, function(tagWithArticles) {
            return _.any(tagWithArticles.articles, function(article) {
                return article.favorite === '1';
            });
        }, this);

        var filtered = _.each(filteredTagsWithArticlesByFavorited, function(filteredTagWithArticles) {
            filteredTagWithArticles.articles = _.filter(filteredTagWithArticles.articles, function(article) {
                return article.favorite === '1';
            });
        });

        console.log(filtered);

        this.setState({ normalFavoritedArticles: filtered });
    },

    render: function() {
        // var normalArticlesToRender = {};
        // if(this.state.normalFavoritedArticles.length > 0) {
        //     normalArticlesToRender = <Articles articles={ this.state.normalFavoritedArticles } />;
        // } else {
        //     normalArticlesToRender = <Articles articles={ this.state.pocketData.normalArticles } />;
        // }

        // var archivedArticlesToRender = <Articles articles={ this.state.pocketData.archivedArticles } archived={ true }/>;
        var loadingIndicator = <div className="progress"><div className="indeterminate"></div></div>;
        var connectButton = !window.localStorage.ACCESS_TOKEN ? <div><p>Connect with your pocket app</p><button type="button" onClick={ this._connectWithPocket }>Connect</button></div> : null;

        // var content = {};
        // if(this.state.pocketData.normalArticles.length > 0) {
        //     content.normal = normalArticlesToRender;
        //     content.archived = archivedArticlesToRender;
        // } else {
        //     content.normal = loadingIndicator;
        //     content.archived = loadingIndicator;
        // }

        var groupedByTags = [];
        _.forEach(this.state.pocketData.tags, function(tag) {
            var tagWithArticles = {
                tag: tag,
                unread: [],
                archived: []
            };

            _.forEach(this.state.pocketData.articles, function(article) {
                if(_.contains(article.tags, tag)) {
                    switch(article.status) {
                        case 'unread':
                            tagWithArticles.unread.push(article);
                            break;
                        case 'archived':
                            tagWithArticles.archived.push(article);
                            break;
                        default: break;
                    }
                }
            }, this);

            if (tagWithArticles.unread.length === 0 && tagWithArticles.archived.length === 0) {
                return;
            }

            groupedByTags.push(tagWithArticles);
        }, this);

        var unreadArticles = <Articles articles={ groupedByTags } filter={ 'unread' } />;
        var archivedArticles = <Articles articles={ groupedByTags } filter={ 'archived' } />;

        return (
            <div className="HomePage">
                <div className="container">
                    <h1>Web Mind Map</h1>
                    { connectButton }
                    <div className="switch">
                        <label>
                            Favorites Off
                            <input type="checkbox" name="favorites" onChange={this._favoritesChecked} />
                            <span className="lever"></span>
                            Favorites On
                        </label>
                    </div>
                </div>
                <div className="col">
                    <ul className="tabs">
                        <li className="tab col"><a href="#all">All</a></li>
                        <li className="tab col"><a href="#archived">Archived</a></li>
                    </ul>
                </div>
                <div className="horizontal-wrapper">
                    <div id="all">
                        { unreadArticles }
                    </div>
                    <div id="archived">
                        { archivedArticles }
                    </div>
                </div>
            </div>
        );
    }
});

React.render(<HomePage />, mainContainer);