window.fbAsyncInit = function() {
	FB.init({
		appId: '364907593572522',
		// App ID
		status: true,
		// check login status
		cookie: true,
		// enable cookies to allow the server to access the session
		xfbml: true // parse XFBML
	});
	checkStatus();

	// Additional initialization code here
};
var myUidTmp = 0;
var USER_ID_REGEX = new RegExp("user_id=(\\d+)");
function checkStatus ()
{
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			var uid = response.authResponse.userID;
			myUidTmp = uid;
			var accessToken = response.authResponse.accessToken;
			fetchMyProfile(myUidTmp);
		} else if (response.status === 'not_authorized') {
			//Logged in, not authorized
			document.getElementById('authSection').style.display = 'block';
		} else {
			document.getElementById('loginSection').style.display = 'block';
		}
	});
}

// Load the SDK Asynchronously
(function(d) {
	var js, id = 'facebook-jssdk',
		ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {
		return;
	}
	js = d.createElement('script');
	js.id = id;
	js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));

function auth() {
	FB.login(function(response) {
		if (response.authResponse) {
			fetchMyProfile(response.authResponse.userID);
		} else {
			//console.log('User cancelled login or did not fully authorize.');
			onAuthFail();
		}
	}, {
		scope: 'user_birthday,user_likes,friends_likes,friends_birthday'
	});
}
var me = null;
function fetchMyProfile (uid)
{
	FB.api('fql', {
		q: "select name, pic_small, birthday_date, uid from user where uid="+uid+";"
	}, function(response) {
		if (!response || response.error) {
			onAuthFail();
		}
		else
		{
			myProfile = response;
			me = new User(myProfile.data[0], true);
			checkPermissions(me);
		}
	});
}
function checkPermissions (me)
{
	FB.api('fql', {
		q: "select user_birthday,user_likes,friends_likes,friends_birthday from permissions where uid=me();"
	}, function(response) {
		if (!response || response.error) {
			onAuthFail();
		}
		else
		{
			perms = response.data[0];
			if (1==perms.user_birthday && 1==perms.user_likes && 1==perms.friends_likes && 1==perms.friends_birthday)
			{
				fetchMyFriends(me);
			}
			else
			{
				auth();
			}
		}
	});
}
var fqlFriends = null;

function fetchMyFriends (me)
{
	var userIdToFetch = null;
	if (location.href.match(USER_ID_REGEX))
	{
		userIdToFetch = parseInt(RegExp.$1);
	}
	FB.api('fql', {
		q: "select uid,name,pic_small,birthday_date from user where is_app_user=1 and uid in (select uid2 from friend where uid1=me())"
	}, function(response) {
		if (!response || response.error) {
			onAuthFail();
		}
		else
		{
			fqlFriends = response;
			renderFriends();
			var friendToShow = User.findFriendByUserId(userIdToFetch);
			if (friendToShow)
			{
				friendToShow.render();
			}
			else
			{
				me.render();
			}
	
		}
	});
}
function fetchMilestones (user)
{
	document.getElementById('authSection').style.display = 'none';
	document.getElementById("loadingSection").style.display = 'block';
	FB.api('fql', {
			q: "select id,owner_id, title, description, start_time from page_milestone where owner_id in (select page_id from page_fan where uid="+user.getUserId()+") order by start_time;"
		}, function(response) {
			if (!response || response.error) {
				onAuthFail();
			}
			else
			{
				fqlMilestones = response;
				fetchPages(user);
			}
		});
}
function onAuthFail () 
{
	document.getElementById('authSection').style.display = 'block';
	document.getElementById("loadingSection").style.display = 'none';
}
function fetchPages (user)
{
	FB.api('fql', {
		q: "select page_id, name, page_url, type, pic_small from page where page_id in (select page_id from page_fan where uid="+user.getUserId()+");"
	}, function(response) {
		if (!response || response.error) {
			onAuthFail();
		}
		else
		{
			pages = response;
			render(user);
		}
	});
};
var APP_URL_BASE = "https://apps.facebook.com/page-age/";
function postURL ()
{
	FB.ui(
	{
		method: 'feed',
		name: 'PageAge',
		link: APP_URL_BASE + "?user_id=" + me.getUserId(),
		description: 'History of my Favorite Things'
	},
	function(response) {
		if (response && response.post_id) {
		} else {
		}
	}
);
}