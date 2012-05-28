var friends = [];
function renderFriends ()
{
	var container = document.getElementById('friendsContainer');
	for (var i=0; i<fqlFriends.data.length; i++)
	{
		friends.push (new User(fqlFriends.data[i], false));
	}
	friends.sort(function(a,b){return (a.random>b.random)?1:-1});
	container.appendChild(me.getBox());
	for (var i=0; i<friends.length; i++)
	{
		container.appendChild(friends[i].getBox());
	}
	document.getElementById('friends').style.display = "block";
}

var User = function (data, isMe)
{
	this.data = data;
	this.random = Math.random();
	this.isMe = isMe;
};
User.prototype.getBox = function ()
{
	if (this.box) return this.box;
	var a = document.createElement('A');
	a.href = "#";
	a.title = this.data.name;
	a.onclick = this.getOnClickAction();
	var icon = document.createElement('DIV');
	icon.className = 'icon';
	icon.style.backgroundImage = 'url(' + this.data.pic_small + ')';
	a.appendChild(icon);
	this.box = a;
	return a;
}
User.prototype.getOnClickAction = function ()
{
	var self = this;
	return function ()
	{
		self.render();
	}
}
var currentUser = null;
User.prototype.render = function ()
{
	if (currentUser==this) return;
	currentUser = this;
	for (var i=0; i<friends.length; i++)
	{
		friends[i].getBox().className = '';
	}
	me.getBox().className = '';
	this.getBox().className = 'selected';
	clear();
	fetchMilestones(this);
};
User.prototype.getUserId = function ()
{
	return this.data.uid;
};
User.findFriendByUserId = function (userId)
{
	for (var i=0; i<friends.length; i++)
	{
		if (userId==friends[i].getUserId())
			return friends[i];
	}
	return null;
}